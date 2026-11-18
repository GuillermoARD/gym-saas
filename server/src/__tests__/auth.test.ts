import { sequelize } from '../config/db'
import { Gym } from '../models'
import { api, auth, registerGym, resetDb } from './helpers'

beforeAll(resetDb)
afterAll(() => sequelize.close())

describe('POST /api/auth/register', () => {
    it('valida los campos obligatorios', async () => {
        const res = await api().post('/api/auth/register').send({})
        expect(res.status).toBe(400)
        expect(res.body.errors.map((e: { field: string }) => e.field))
            .toEqual(expect.arrayContaining(['gymName', 'ownerName', 'email', 'password']))
    })

    it('crea el gimnasio y su dueño, sin devolver el hash', async () => {
        const res = await api().post('/api/auth/register').send({
            gymName: 'Fuerza Bávaro',
            ownerName: 'Ana',
            email: 'ANA@Gym.do',
            password: 'password123',
        })
        expect(res.status).toBe(201)
        expect(res.body.token).toEqual(expect.any(String))
        expect(res.body.user).toMatchObject({ email: 'ana@gym.do', role: 'owner' })
        expect(res.body.user.passwordHash).toBeUndefined()
        expect(res.body.user.gym.slug).toMatch(/^fuerza-bavaro-/)
    })

    it('no permite emails repetidos', async () => {
        const res = await api().post('/api/auth/register').send({
            gymName: 'Otro', ownerName: 'Ana', email: 'ana@gym.do', password: 'password123',
        })
        expect(res.status).toBe(409)
    })
})

describe('POST /api/auth/login', () => {
    it('rechaza contraseña incorrecta', async () => {
        const res = await api().post('/api/auth/login').send({ email: 'ana@gym.do', password: 'mala-password' })
        expect(res.status).toBe(401)
    })

    it('inicia sesion con credenciales correctas', async () => {
        const res = await api().post('/api/auth/login').send({ email: 'ana@gym.do', password: 'password123' })
        expect(res.status).toBe(200)
        expect(res.body.token).toEqual(expect.any(String))
    })

    it('bloquea el login si el gimnasio esta desactivado', async () => {
        const { gymId, user } = await registerGym('Desactivado')
        await Gym.update({ active: false }, { where: { id: gymId } })

        const res = await api().post('/api/auth/login').send({ email: user.email, password: 'password123' })
        expect(res.status).toBe(403)
        expect(res.body.token).toBeUndefined()
    })
})

describe('GET /api/auth/me', () => {
    it('requiere token', async () => {
        expect((await api().get('/api/auth/me')).status).toBe(401)
        expect((await api().get('/api/auth/me').set(auth('token-falso'))).status).toBe(401)
    })

    it('devuelve el usuario y rechaza si su gimnasio se desactiva', async () => {
        const { token, gymId } = await registerGym()
        const ok = await api().get('/api/auth/me').set(auth(token))
        expect(ok.status).toBe(200)
        expect(ok.body.user.gymId).toBe(gymId)

        await Gym.update({ active: false }, { where: { id: gymId } })
        expect((await api().get('/api/auth/me').set(auth(token))).status).toBe(403)
    })
})
