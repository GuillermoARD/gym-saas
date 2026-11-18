import { Router } from 'express'
import { Op } from 'sequelize'
import { z } from 'zod'
import { requireRole } from '../middleware/auth'
import { CheckIn, Client, Membership } from '../models'
import { hasAccess, summarizeMemberships, type MembershipSummary } from '../services/membership'
import { startOfDay, addDays, today } from '../utils/dates'
import { HttpError } from '../utils/errors'

const router = Router()
router.use(requireRole('owner', 'reception'))

// Se puede marcar con el código del QR (escáner) o con el id (búsqueda manual en recepción)
const checkInSchema = z.object({
    code: z.string().trim().min(1).max(64).optional(),
    clientId: z.coerce.number().int().positive().optional(),
}).refine(data => data.code || data.clientId, { message: 'Escanea el QR o selecciona un cliente' })

const DENIED_REASONS: Record<MembershipSummary['state'], string> = {
    active: '',
    expiring: '',
    upcoming: 'Su membresia todavia no ha empezado',
    expired: 'Membresia vencida',
    none: 'No tiene membresia',
}

router.post('/', async (req, res) => {
    const { code, clientId } = checkInSchema.parse(req.body)
    const gymId = req.gymId!

    const client = await Client.findOne({
        where: { gymId, ...(code ? { qrCode: code } : { id: clientId }) },
        include: [{ model: Membership, as: 'memberships', where: { status: 'active' }, required: false }],
    })
    if (!client) throw new HttpError(404, 'Cliente no encontrado. Verifica el codigo QR')

    const membership = summarizeMemberships(client.memberships ?? [])
    const allowed = client.active && hasAccess(membership)
    const reason = !client.active ? 'Cliente desactivado' : allowed ? null : DENIED_REASONS[membership.state]

    const alreadyToday = await CheckIn.count({
        where: { gymId, clientId: client.id, allowed: true, createdAt: { [Op.gte]: startOfDay(today()) } },
    })

    const checkIn = await CheckIn.create({
        gymId,
        clientId: client.id,
        membershipId: membership.currentMembershipId,
        allowed,
        reason,
        registeredById: req.user!.id,
    })

    res.status(201).json({
        data: {
            checkIn,
            allowed,
            reason,
            alreadyCheckedInToday: alreadyToday > 0,
            client: {
                id: client.id,
                firstName: client.firstName,
                lastName: client.lastName,
                membership,
            },
        },
    })
})

// Entradas de un día (por defecto hoy)
router.get('/', async (req, res) => {
    const { date = today() } = z.object({ date: z.iso.date().optional() }).parse(req.query)

    const checkIns = await CheckIn.findAll({
        where: {
            gymId: req.gymId!,
            createdAt: { [Op.gte]: startOfDay(date), [Op.lt]: startOfDay(addDays(date, 1)) },
        },
        include: [{ model: Client, as: 'client', attributes: ['id', 'firstName', 'lastName'] }],
        order: [['createdAt', 'DESC']],
    })
    res.json({ data: checkIns })
})

export default router
