import { sequelize } from '../config/db'
import { api, auth, createStaff, registerGym, resetDb } from './helpers'

beforeAll(resetDb)
afterAll(() => sequelize.close())

describe('aislamiento entre gimnasios', () => {
    it('un gimnasio no ve ni modifica datos de otro', async () => {
        const gymA = await registerGym('Gym A')
        const gymB = await registerGym('Gym B')

        const plan = await api().post('/api/plans').set(auth(gymA.token))
            .send({ name: 'Mensual', price: 1500, durationDays: 30 })
        const client = await api().post('/api/clients').set(auth(gymA.token))
            .send({ firstName: 'Juan', lastName: 'Perez' })

        expect((await api().get('/api/plans').set(auth(gymB.token))).body.data).toHaveLength(0)
        expect((await api().get('/api/clients').set(auth(gymB.token))).body.data).toHaveLength(0)
        expect((await api().get(`/api/clients/${client.body.data.id}`).set(auth(gymB.token))).status).toBe(404)
        expect((await api().put(`/api/plans/${plan.body.data.id}`).set(auth(gymB.token))
            .send({ name: 'Hack', price: 1, durationDays: 1 })).status).toBe(404)

        // ni vender una membresía con el plan de otro gimnasio
        const clientB = await api().post('/api/clients').set(auth(gymB.token)).send({ firstName: 'Ana', lastName: 'B' })
        const sell = await api().post(`/api/clients/${clientB.body.data.id}/memberships`).set(auth(gymB.token))
            .send({ planId: plan.body.data.id, payment: { method: 'cash' } })
        expect(sell.status).toBe(404)
    })
})

describe('permisos por rol', () => {
    let ownerToken: string
    let receptionToken: string
    let trainerToken: string

    beforeAll(async () => {
        const gym = await registerGym('Roles Gym')
        ownerToken = gym.token
        receptionToken = await createStaff(gym.gymId, 'reception')
        trainerToken = await createStaff(gym.gymId, 'trainer')
    })

    it('solo el dueño crea planes y maneja personal', async () => {
        const plan = { name: 'Mensual', price: 1500, durationDays: 30 }
        expect((await api().post('/api/plans').set(auth(receptionToken)).send(plan)).status).toBe(403)
        expect((await api().post('/api/plans').set(auth(trainerToken)).send(plan)).status).toBe(403)
        expect((await api().post('/api/plans').set(auth(ownerToken)).send(plan)).status).toBe(201)

        expect((await api().get('/api/staff').set(auth(receptionToken))).status).toBe(403)
        expect((await api().get('/api/staff').set(auth(ownerToken))).status).toBe(200)
    })

    it('recepcion registra clientes; entrenador solo consulta', async () => {
        const client = { firstName: 'Luis', lastName: 'Gomez' }
        expect((await api().post('/api/clients').set(auth(receptionToken)).send(client)).status).toBe(201)
        expect((await api().post('/api/clients').set(auth(trainerToken)).send(client)).status).toBe(403)
        expect((await api().get('/api/clients').set(auth(trainerToken))).status).toBe(200)
        expect((await api().get('/api/payments').set(auth(trainerToken))).status).toBe(403)
    })

    it('el entrenador ve el dashboard pero no el dinero', async () => {
        const res = await api().get('/api/dashboard').set(auth(trainerToken))
        expect(res.status).toBe(200)
        expect(res.body.data.revenue).toBeNull()
    })

    it('el dueño crea personal y no puede desactivarse a si mismo', async () => {
        const created = await api().post('/api/staff').set(auth(ownerToken)).send({
            name: 'Nueva Recepcion', email: 'nueva@test.do', password: 'password123', role: 'reception',
        })
        expect(created.status).toBe(201)
        expect(created.body.data.passwordHash).toBeUndefined()

        const login = await api().post('/api/auth/login').send({ email: 'nueva@test.do', password: 'password123' })
        expect(login.status).toBe(200)

        const me = await api().get('/api/auth/me').set(auth(ownerToken))
        const self = await api().patch(`/api/staff/${me.body.user.id}`).set(auth(ownerToken)).send({ active: false })
        expect(self.status).toBe(400)

        const off = await api().patch(`/api/staff/${created.body.data.id}`).set(auth(ownerToken)).send({ active: false })
        expect(off.status).toBe(200)
        expect((await api().get('/api/auth/me').set(auth(login.body.token))).status).toBe(401)
    })

    it('mantenimiento figura en el personal sin email ni acceso al sistema', async () => {
        const created = await api().post('/api/staff').set(auth(ownerToken)).send({ name: 'Pedro Limpieza', role: 'maintenance' })
        expect(created.status).toBe(201)
        expect(created.body.data.email).toBeNull()

        // sin email y contraseña no se le puede dar un rol con acceso
        const promote = await api().patch(`/api/staff/${created.body.data.id}`).set(auth(ownerToken)).send({ role: 'reception' })
        expect(promote.status).toBe(400)

        const missing = await api().post('/api/staff').set(auth(ownerToken)).send({ name: 'Sin Email', role: 'reception' })
        expect(missing.status).toBe(400)
    })

    it('pasar a mantenimiento le quita el acceso', async () => {
        const created = await api().post('/api/staff').set(auth(ownerToken)).send({
            name: 'Ex Recepcion', email: 'ex@test.do', password: 'password123', role: 'reception',
        })
        const login = await api().post('/api/auth/login').send({ email: 'ex@test.do', password: 'password123' })
        expect(login.status).toBe(200)

        await api().patch(`/api/staff/${created.body.data.id}`).set(auth(ownerToken)).send({ role: 'maintenance' })
        expect((await api().get('/api/auth/me').set(auth(login.body.token))).status).toBe(401)
        expect((await api().post('/api/auth/login').send({ email: 'ex@test.do', password: 'password123' })).status).toBe(401)
    })
})
