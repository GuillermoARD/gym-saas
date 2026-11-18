import request from 'supertest'
import bcrypt from 'bcrypt'
import { app } from '../app'
import { sequelize } from '../config/db'
import { User, type Role } from '../models'

export const api = () => request(app)

export async function resetDb() {
    await sequelize.sync({ force: true })
}

let counter = 0

/** Registra un gimnasio nuevo y devuelve el token del dueño */
export async function registerGym(name = 'Gym Test') {
    counter++
    const res = await api().post('/api/auth/register').send({
        gymName: name,
        ownerName: 'Dueño',
        email: `owner${counter}@test.do`,
        password: 'password123',
    })
    if (res.status !== 201) throw new Error(`registro fallo: ${JSON.stringify(res.body)}`)
    return { token: res.body.token as string, gymId: res.body.user.gymId as number, user: res.body.user }
}

/** Crea un empleado en el gimnasio y devuelve su token */
export async function createStaff(gymId: number, role: Role) {
    counter++
    const email = `${role}${counter}@test.do`
    await User.create({ gymId, name: role, email, role, passwordHash: await bcrypt.hash('password123', 4) })
    const res = await api().post('/api/auth/login').send({ email, password: 'password123' })
    return res.body.token as string
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` })
