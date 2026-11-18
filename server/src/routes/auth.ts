import { randomBytes } from 'node:crypto'
import { Router } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { sequelize } from '../config/db'
import { authenticate, signToken } from '../middleware/auth'
import { Gym, NO_ACCESS_ROLES, User } from '../models'
import { HttpError } from '../utils/errors'

const router = Router()

export const passwordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72)
const emailSchema = z.email('Email no valido').transform(v => v.toLowerCase().trim())

const registerSchema = z.object({
    gymName: z.string().trim().min(2, 'El nombre del gimnasio es obligatorio').max(120),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(255).optional(),
    ownerName: z.string().trim().min(2, 'Tu nombre es obligatorio').max(120),
    email: emailSchema,
    password: passwordSchema,
})

const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'La contraseña es obligatoria'),
})

function slugify(text: string) {
    const base = text
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        .slice(0, 120)
    return `${base || 'gym'}-${randomBytes(3).toString('hex')}`
}

async function userWithGym(id: number) {
    return User.findByPk(id, { include: [{ model: Gym, as: 'gym' }] })
}

// Registro de un gimnasio nuevo + su dueño
router.post('/register', async (req, res) => {
    const data = registerSchema.parse(req.body)

    if (await User.findOne({ where: { email: data.email } })) {
        throw new HttpError(409, 'Ya existe una cuenta con ese email')
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    const owner = await sequelize.transaction(async transaction => {
        const gym = await Gym.create({
            name: data.gymName,
            slug: slugify(data.gymName),
            phone: data.phone ?? null,
            address: data.address ?? null,
        }, { transaction })

        return User.create({
            gymId: gym.id,
            name: data.ownerName,
            email: data.email,
            passwordHash,
            role: 'owner',
        }, { transaction })
    })

    const user = await userWithGym(owner.id)
    res.status(201).json({ token: signToken(owner), user })
})

router.post('/login', async (req, res) => {
    const { email, password } = loginSchema.parse(req.body)

    const user = await User.findOne({ where: { email }, include: [{ model: Gym, as: 'gym' }] })
    // mismo mensaje para email o contraseña incorrectos
    if (!user?.passwordHash || NO_ACCESS_ROLES.includes(user.role) || !(await bcrypt.compare(password, user.passwordHash))) {
        throw new HttpError(401, 'Email o contraseña incorrectos')
    }
    if (!user.active) throw new HttpError(403, 'Tu usuario esta desactivado')
    if (user.gym && !user.gym.active) throw new HttpError(403, 'Este gimnasio esta desactivado')

    res.json({ token: signToken(user), user })
})

router.get('/me', authenticate, (req, res) => {
    res.json({ user: req.user })
})

export default router
