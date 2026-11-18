import { Router } from 'express'
import { requireRole } from '../middleware/auth'
import { Membership } from '../models'
import { HttpError, parseId } from '../utils/errors'

const router = Router()

// Cancelar una membresía (ej. se vendió por error). El pago queda registrado.
router.patch('/:id/cancel', requireRole('owner'), async (req, res) => {
    const membership = await Membership.findOne({ where: { id: parseId(req.params.id), gymId: req.gymId! } })
    if (!membership) throw new HttpError(404, 'Membresia no encontrada')
    if (membership.status === 'cancelled') throw new HttpError(400, 'La membresia ya esta cancelada')

    await membership.update({ status: 'cancelled' })
    res.json({ data: membership })
})

export default router
