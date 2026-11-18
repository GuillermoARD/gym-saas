import { Router } from 'express'
import { z } from 'zod'
import { requireRole } from '../middleware/auth'
import { Plan } from '../models'
import { HttpError, parseId } from '../utils/errors'

const router = Router()

const planSchema = z.object({
    name: z.string().trim().min(2, 'El nombre del plan es obligatorio').max(100),
    description: z.string().trim().max(255).nullish(),
    price: z.coerce.number('El precio debe ser un numero').positive('El precio debe ser mayor a 0').max(99_999_999),
    durationDays: z.coerce.number().int('La duracion debe ser en dias enteros').min(1, 'Minimo 1 dia').max(3650),
    active: z.boolean().optional(),
})

async function findPlan(id: number, gymId: number) {
    const plan = await Plan.findOne({ where: { id, gymId } })
    if (!plan) throw new HttpError(404, 'Plan no encontrado')
    return plan
}

// ?all=true incluye los planes desactivados
router.get('/', async (req, res) => {
    const plans = await Plan.findAll({
        where: { gymId: req.gymId!, ...(req.query.all === 'true' ? {} : { active: true }) },
        order: [['price', 'ASC']],
    })
    res.json({ data: plans })
})

router.get('/:id', async (req, res) => {
    res.json({ data: await findPlan(parseId(req.params.id), req.gymId!) })
})

router.post('/', requireRole('owner'), async (req, res) => {
    const data = planSchema.parse(req.body)
    const plan = await Plan.create({ ...data, gymId: req.gymId! })
    res.status(201).json({ data: plan })
})

router.put('/:id', requireRole('owner'), async (req, res) => {
    const plan = await findPlan(parseId(req.params.id), req.gymId!)
    await plan.update(planSchema.parse(req.body))
    res.json({ data: plan })
})

// No se borra: las membresías vendidas siguen apuntando al plan
router.delete('/:id', requireRole('owner'), async (req, res) => {
    const plan = await findPlan(parseId(req.params.id), req.gymId!)
    await plan.update({ active: false })
    res.json({ data: plan })
})

export default router
