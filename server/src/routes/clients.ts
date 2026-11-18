import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import { z } from 'zod'
import { sequelize } from '../config/db'
import { requireRole } from '../middleware/auth'
import { CheckIn, Client, Membership, PAYMENT_METHODS, Payment, Plan, User } from '../models'
import { summarizeMemberships, type MembershipState } from '../services/membership'
import { addDays, today } from '../utils/dates'
import { HttpError, parseId } from '../utils/errors'
import { searchWhere } from '../utils/search'

const router = Router()
const canWrite = requireRole('owner', 'reception')

const optionalText = (max: number) => z.string().trim().max(max).nullish().transform(v => v || null)

const clientSchema = z.object({
    firstName: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
    lastName: z.string().trim().min(1, 'El apellido es obligatorio').max(80),
    phone: optionalText(30),
    email: z.union([z.email('Email no valido'), z.literal('')]).nullish().transform(v => v || null),
    documentId: optionalText(30),
    birthDate: z.iso.date('Fecha no valida').nullish().or(z.literal('').transform(() => null)),
    notes: optionalText(1000),
    active: z.boolean().optional(),
})

const listQuerySchema = z.object({
    search: z.string().max(100).optional(),
    state: z.enum(['active', 'expiring', 'upcoming', 'expired', 'none']).optional(),
    includeInactive: z.enum(['true', 'false']).optional(),
})

const sellMembershipSchema = z.object({
    planId: z.coerce.number().int().positive('Selecciona un plan'),
    startDate: z.iso.date('Fecha no valida').optional(),
    payment: z.object({
        method: z.enum(PAYMENT_METHODS, 'Metodo de pago no valido'),
        amount: z.coerce.number().positive('El monto debe ser mayor a 0').optional(),
        reference: optionalText(100),
        notes: optionalText(255),
    }),
})

const activeMemberships = {
    model: Membership,
    as: 'memberships',
    where: { status: 'active' },
    required: false,
}

async function findClient(id: number, gymId: number) {
    const client = await Client.findOne({ where: { id, gymId } })
    if (!client) throw new HttpError(404, 'Cliente no encontrado')
    return client
}

function withSummary(client: Client) {
    const data: Record<string, unknown> = client.get({ plain: true })
    delete data.memberships
    return { ...data, membership: summarizeMemberships(client.memberships ?? []) }
}

router.get('/', async (req, res) => {
    const { search, state, includeInactive } = listQuerySchema.parse(req.query)

    const clients = await Client.findAll({
        where: {
            gymId: req.gymId!,
            ...(includeInactive === 'true' ? {} : { active: true }),
            ...(search ? searchWhere(search, ['firstName', 'lastName', 'phone', 'documentId', 'email']) : {}),
        },
        include: [activeMemberships],
        order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    })

    // El estado depende de fechas, se calcula aquí (gimnasios pequeños: pocos cientos de clientes)
    let data = clients.map(withSummary)
    if (state) data = data.filter(c => c.membership.state === (state as MembershipState))

    res.json({ data })
})

router.post('/', canWrite, async (req, res) => {
    const client = await Client.create({ ...clientSchema.parse(req.body), gymId: req.gymId! })
    res.status(201).json({ data: { ...client.toJSON(), membership: summarizeMemberships([]) } })
})

router.get('/:id', async (req, res) => {
    const id = parseId(req.params.id)
    const client = await Client.findOne({ where: { id, gymId: req.gymId! } })
    if (!client) throw new HttpError(404, 'Cliente no encontrado')

    const [memberships, payments, checkIns] = await Promise.all([
        Membership.findAll({
            where: { clientId: id, gymId: req.gymId! },
            include: [{ model: Plan, as: 'plan', attributes: ['id', 'name', 'durationDays'] }],
            order: [['startDate', 'DESC']],
        }),
        Payment.findAll({
            where: { clientId: id, gymId: req.gymId! },
            include: [{ model: User, as: 'receivedBy', attributes: ['id', 'name'] }],
            order: [['paidAt', 'DESC']],
            limit: 50,
        }),
        CheckIn.findAll({
            where: { clientId: id, gymId: req.gymId! },
            order: [['createdAt', 'DESC']],
            limit: 30,
        }),
    ])

    res.json({
        data: {
            ...client.toJSON(),
            membership: summarizeMemberships(memberships),
            memberships,
            payments,
            checkIns,
        },
    })
})

router.put('/:id', canWrite, async (req, res) => {
    const client = await findClient(parseId(req.params.id), req.gymId!)
    await client.update(clientSchema.parse(req.body))
    res.json({ data: client })
})

// Si el cliente pierde su carnet, el QR viejo deja de servir
router.post('/:id/regenerate-qr', canWrite, async (req, res) => {
    const client = await findClient(parseId(req.params.id), req.gymId!)
    await client.update({ qrCode: randomUUID() })
    res.json({ data: client })
})

// Vender o renovar una membresía (crea la membresía y su pago en una transacción)
router.post('/:id/memberships', canWrite, async (req, res) => {
    const clientId = parseId(req.params.id)
    const data = sellMembershipSchema.parse(req.body)
    const gymId = req.gymId!

    const client = await findClient(clientId, gymId)
    if (!client.active) throw new HttpError(400, 'El cliente esta desactivado')

    const plan = await Plan.findOne({ where: { id: data.planId, gymId, active: true } })
    if (!plan) throw new HttpError(404, 'Plan no encontrado')

    // Renovación: si todavía tiene días, la nueva empieza cuando termine la actual
    let startDate = data.startDate
    if (!startDate) {
        const current = await Membership.findAll({ where: { clientId, gymId, status: 'active' } })
        const latestEnd = current.reduce<string | null>((max, m) => (!max || m.endDate > max ? m.endDate : max), null)
        startDate = latestEnd && latestEnd >= today() ? addDays(latestEnd, 1) : today()
    }
    const endDate = addDays(startDate, plan.durationDays - 1)

    const result = await sequelize.transaction(async transaction => {
        const membership = await Membership.create({
            gymId, clientId, planId: plan.id, startDate, endDate, price: plan.price,
        }, { transaction })

        const payment = await Payment.create({
            gymId,
            clientId,
            membershipId: membership.id,
            amount: data.payment.amount ?? plan.price,
            method: data.payment.method,
            reference: data.payment.reference,
            notes: data.payment.notes,
            receivedById: req.user!.id,
        }, { transaction })

        return { membership, payment }
    })

    res.status(201).json({ data: result })
})

export default router
