import { Router } from 'express'
import { Op, type WhereOptions } from 'sequelize'
import { z } from 'zod'
import { requireRole } from '../middleware/auth'
import { Client, PAYMENT_METHODS, Payment, User } from '../models'
import { addDays, startOfDay, startOfMonth, today } from '../utils/dates'

const router = Router()
router.use(requireRole('owner', 'reception'))

const querySchema = z.object({
    from: z.iso.date('Fecha no valida').optional(),
    to: z.iso.date('Fecha no valida').optional(),
    method: z.enum(PAYMENT_METHODS).optional(),
})

// Por defecto: pagos del mes actual
router.get('/', async (req, res) => {
    const { from = startOfMonth(today()), to = today(), method } = querySchema.parse(req.query)

    const where: WhereOptions<Payment> = {
        gymId: req.gymId!,
        paidAt: { [Op.gte]: startOfDay(from), [Op.lt]: startOfDay(addDays(to, 1)) },
        ...(method ? { method } : {}),
    }

    const payments = await Payment.findAll({
        where,
        include: [
            { model: Client, as: 'client', attributes: ['id', 'firstName', 'lastName'] },
            { model: User, as: 'receivedBy', attributes: ['id', 'name'] },
        ],
        order: [['paidAt', 'DESC']],
    })

    const total = payments.reduce((sum, p) => sum + p.amount, 0)
    const byMethod = Object.fromEntries(PAYMENT_METHODS.map(m => [
        m, payments.filter(p => p.method === m).reduce((sum, p) => sum + p.amount, 0),
    ]))

    res.json({ data: payments, summary: { from, to, total, count: payments.length, byMethod } })
})

export default router
