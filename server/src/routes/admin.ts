import { Router } from 'express'
import { z } from 'zod'
import { requireRole } from '../middleware/auth'
import { Client, Gym, User } from '../models'
import { HttpError, parseId } from '../utils/errors'

// Panel del super admin (tú): ver y activar/desactivar gimnasios
const router = Router()
router.use(requireRole('super_admin'))

router.get('/gyms', async (_req, res) => {
    const gyms = await Gym.findAll({
        include: [{ model: User, as: 'users', where: { role: 'owner' }, required: false, attributes: ['id', 'name', 'email'] }],
        order: [['createdAt', 'DESC']],
    })

    const data = await Promise.all(gyms.map(async gym => ({
        ...gym.toJSON(),
        clientsCount: await Client.count({ where: { gymId: gym.id, active: true } }),
    })))

    res.json({ data })
})

router.patch('/gyms/:id', async (req, res) => {
    const { active } = z.object({ active: z.boolean() }).parse(req.body)
    const gym = await Gym.findByPk(parseId(req.params.id))
    if (!gym) throw new HttpError(404, 'Gimnasio no encontrado')

    await gym.update({ active })
    res.json({ data: gym })
})

export default router
