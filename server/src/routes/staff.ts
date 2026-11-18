import { Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { requireRole } from '../middleware/auth'
import { NO_ACCESS_ROLES, STAFF_ROLES, User } from '../models'
import { HttpError, parseId } from '../utils/errors'
import { passwordSchema } from './auth'

// Solo el dueño administra al personal de su gimnasio
const router = Router()
router.use(requireRole('owner'))

const emailSchema = z.union([z.email('Email no valido'), z.literal('')])
    .optional()
    .transform(v => v ? v.toLowerCase().trim() : undefined)

const createSchema = z.object({
    name: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
    email: emailSchema,
    password: z.union([passwordSchema, z.literal('')]).optional(),
    role: z.enum(STAFF_ROLES, 'Rol no valido'),
}).superRefine((data, ctx) => {
    // el personal sin acceso (mantenimiento) no necesita email ni contraseña
    if (NO_ACCESS_ROLES.includes(data.role)) return
    if (!data.email) ctx.addIssue({ code: 'custom', path: ['email'], message: 'El email es obligatorio para entrar al sistema' })
    if (!data.password) ctx.addIssue({ code: 'custom', path: ['password'], message: 'La contraseña es obligatoria para entrar al sistema' })
})

const updateSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    email: emailSchema,
    role: z.enum(STAFF_ROLES, 'Rol no valido').optional(),
    active: z.boolean().optional(),
    password: passwordSchema.optional(),
})

async function assertEmailFree(email: string, exceptId?: number) {
    const existing = await User.findOne({ where: { email } })
    if (existing && existing.id !== exceptId) throw new HttpError(409, 'Ya existe un usuario con ese email')
}

router.get('/', async (req, res) => {
    const staff = await User.findAll({
        where: { gymId: req.gymId! },
        order: [['name', 'ASC']],
    })
    res.json({ data: staff })
})

router.post('/', async (req, res) => {
    const { password, ...data } = createSchema.parse(req.body)
    if (data.email) await assertEmailFree(data.email)

    const hasAccess = !NO_ACCESS_ROLES.includes(data.role)
    const user = await User.create({
        ...data,
        email: data.email ?? null,
        gymId: req.gymId!,
        passwordHash: hasAccess && password ? await bcrypt.hash(password, 10) : null,
    })
    res.status(201).json({ data: user })
})

router.patch('/:id', async (req, res) => {
    const id = parseId(req.params.id)
    const { password, ...data } = updateSchema.parse(req.body)

    const user = await User.findOne({ where: { id, gymId: req.gymId! } })
    if (!user) throw new HttpError(404, 'Usuario no encontrado')

    // evita que el dueño se quede sin acceso por accidente
    if (user.id === req.user!.id && (data.active === false || (data.role && data.role !== 'owner'))) {
        throw new HttpError(400, 'No puedes desactivarte ni quitarte el rol de dueño')
    }

    if (data.email && data.email !== user.email) await assertEmailFree(data.email, user.id)

    const role = data.role ?? user.role
    let passwordHash = user.passwordHash
    if (NO_ACCESS_ROLES.includes(role)) {
        passwordHash = null
    } else {
        if (password) passwordHash = await bcrypt.hash(password, 10)
        // pasar de mantenimiento a un rol con acceso necesita email y contraseña
        if (!(data.email ?? user.email) || !passwordHash) {
            throw new HttpError(400, 'Para darle acceso al sistema ponle email y contraseña')
        }
    }

    const { email, ...rest } = data
    await user.update({ ...rest, ...(email ? { email } : {}), passwordHash })
    res.json({ data: user })
})

export default router
