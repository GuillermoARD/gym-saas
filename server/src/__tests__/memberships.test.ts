import { sequelize } from '../config/db'
import { Membership } from '../models'
import { summarizeMemberships } from '../services/membership'
import { addDays, today } from '../utils/dates'
import { api, auth, registerGym, resetDb } from './helpers'

beforeAll(resetDb)
afterAll(() => sequelize.close())

describe('summarizeMemberships', () => {
    const m = (startDate: string, endDate: string, status: 'active' | 'cancelled' = 'active') =>
        ({ id: 1, startDate, endDate, status }) as Membership
    const ref = '2026-06-15'

    it('detecta cada estado', () => {
        expect(summarizeMemberships([], ref).state).toBe('none')
        expect(summarizeMemberships([m('2026-06-01', '2026-06-30')], ref)).toMatchObject({ state: 'active', daysLeft: 15 })
        expect(summarizeMemberships([m('2026-05-20', '2026-06-18')], ref)).toMatchObject({ state: 'expiring', daysLeft: 3 })
        expect(summarizeMemberships([m('2026-05-01', '2026-05-30')], ref)).toMatchObject({ state: 'expired', daysLeft: -16 })
        expect(summarizeMemberships([m('2026-06-20', '2026-07-19')], ref).state).toBe('upcoming')
        expect(summarizeMemberships([m('2026-06-01', '2026-06-30', 'cancelled')], ref).state).toBe('none')
    })

    it('las renovaciones encadenadas cuentan para el vencimiento', () => {
        const summary = summarizeMemberships([m('2026-05-20', '2026-06-18'), m('2026-06-19', '2026-07-18')], ref)
        expect(summary).toMatchObject({ state: 'active', expiresOn: '2026-07-18' })
    })
})

describe('venta de membresías, pagos y check-in', () => {
    let token: string
    let planId: number
    let clientId: number
    let qrCode: string

    beforeAll(async () => {
        ;({ token } = await registerGym('Flow Gym'))
        planId = (await api().post('/api/plans').set(auth(token))
            .send({ name: 'Mensual', price: 1500, durationDays: 30 })).body.data.id
        const client = await api().post('/api/clients').set(auth(token))
            .send({ firstName: 'María', lastName: 'Rodríguez', phone: '809-555-1234', email: '' })
        clientId = client.body.data.id
        qrCode = client.body.data.qrCode
    })

    it('un cliente sin membresía no puede entrar', async () => {
        const res = await api().post('/api/checkins').set(auth(token)).send({ code: qrCode })
        expect(res.status).toBe(201)
        expect(res.body.data).toMatchObject({ allowed: false, reason: 'No tiene membresia' })
    })

    it('vende una membresía y registra el pago', async () => {
        const res = await api().post(`/api/clients/${clientId}/memberships`).set(auth(token))
            .send({ planId, payment: { method: 'transfer', reference: 'BHD-123' } })
        expect(res.status).toBe(201)
        expect(res.body.data.membership).toMatchObject({ startDate: today(), endDate: addDays(today(), 29), price: 1500 })
        expect(res.body.data.payment).toMatchObject({ amount: 1500, method: 'transfer', reference: 'BHD-123' })
    })

    it('la renovación empieza cuando termina la actual', async () => {
        const res = await api().post(`/api/clients/${clientId}/memberships`).set(auth(token))
            .send({ planId, payment: { method: 'cash', amount: 1400 } })
        expect(res.body.data.membership.startDate).toBe(addDays(today(), 30))
        expect(res.body.data.payment.amount).toBe(1400)

        const detail = await api().get(`/api/clients/${clientId}`).set(auth(token))
        expect(detail.body.data.membership).toMatchObject({ state: 'active', expiresOn: addDays(today(), 59) })
        expect(detail.body.data.memberships).toHaveLength(2)
        expect(detail.body.data.payments).toHaveLength(2)
    })

    it('con membresía activa el check-in es permitido (por QR o por id)', async () => {
        const byQr = await api().post('/api/checkins').set(auth(token)).send({ code: qrCode })
        expect(byQr.body.data).toMatchObject({ allowed: true, alreadyCheckedInToday: false })

        const byId = await api().post('/api/checkins').set(auth(token)).send({ clientId })
        expect(byId.body.data).toMatchObject({ allowed: true, alreadyCheckedInToday: true })

        const list = await api().get('/api/checkins').set(auth(token))
        expect(list.body.data).toHaveLength(3) // incluye el intento rechazado
    })

    it('rechaza QR desconocido y regenerar el QR invalida el viejo', async () => {
        expect((await api().post('/api/checkins').set(auth(token)).send({ code: 'no-existe' })).status).toBe(404)

        const regen = await api().post(`/api/clients/${clientId}/regenerate-qr`).set(auth(token))
        expect(regen.body.data.qrCode).not.toBe(qrCode)
        expect((await api().post('/api/checkins').set(auth(token)).send({ code: qrCode })).status).toBe(404)
    })

    it('una membresía vencida no deja entrar', async () => {
        const client = await api().post('/api/clients').set(auth(token)).send({ firstName: 'Carlos', lastName: 'Vencido' })
        await api().post(`/api/clients/${client.body.data.id}/memberships`).set(auth(token))
            .send({ planId, startDate: addDays(today(), -40), payment: { method: 'cash' } })

        const res = await api().post('/api/checkins').set(auth(token)).send({ clientId: client.body.data.id })
        expect(res.body.data).toMatchObject({ allowed: false, reason: 'Membresia vencida' })

        const expired = await api().get('/api/clients?state=expired').set(auth(token))
        expect(expired.body.data.map((c: { lastName: string }) => c.lastName)).toEqual(['Vencido'])
    })

    it('busca clientes por nombre y apellido', async () => {
        const res = await api().get('/api/clients').query({ search: 'mar rod' }).set(auth(token))
        expect(res.body.data).toHaveLength(1)
        expect(res.body.data[0].membership.state).toBe('active')
    })

    it('el dashboard y los pagos suman bien', async () => {
        const dash = await api().get('/api/dashboard').set(auth(token))
        expect(dash.body.data.members).toMatchObject({ total: 2, active: 1, expired: 1 })
        expect(dash.body.data.checkIns.today).toBe(2)
        expect(dash.body.data.revenue).toMatchObject({
            today: 4400,
            byMethod: { cash: 2900, transfer: 1500, card: 0 },
        })

        const payments = await api().get('/api/payments').set(auth(token))
        expect(payments.body.summary).toMatchObject({ total: 4400, count: 3 })

        const cash = await api().get('/api/payments?method=cash').set(auth(token))
        expect(cash.body.summary.total).toBe(2900)
    })

    it('el dueño puede cancelar una membresía', async () => {
        const detail = await api().get(`/api/clients/${clientId}`).set(auth(token))
        const [renewal] = detail.body.data.memberships
        const res = await api().patch(`/api/memberships/${renewal.id}/cancel`).set(auth(token))
        expect(res.body.data.status).toBe('cancelled')

        const after = await api().get(`/api/clients/${clientId}`).set(auth(token))
        expect(after.body.data.membership.expiresOn).toBe(addDays(today(), 29))
    })

    it('valida los datos de venta', async () => {
        const res = await api().post(`/api/clients/${clientId}/memberships`).set(auth(token))
            .send({ planId, payment: { method: 'bitcoin' } })
        expect(res.status).toBe(400)
        expect(res.body.errors[0].field).toBe('payment.method')
    })
})
