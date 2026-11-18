import { Router } from 'express'
import { Op } from 'sequelize'
import { CheckIn, Client, Membership, PAYMENT_METHODS, Payment } from '../models'
import { summarizeMemberships } from '../services/membership'
import { startOfDay, startOfMonth, today } from '../utils/dates'

const router = Router()

router.get('/', async (req, res) => {
    const gymId = req.gymId!
    const date = today()
    const canSeeMoney = req.user!.role === 'owner' || req.user!.role === 'reception'

    const [clients, todayCheckIns, monthPayments] = await Promise.all([
        Client.findAll({
            where: { gymId, active: true },
            include: [{ model: Membership, as: 'memberships', where: { status: 'active' }, required: false }],
        }),
        CheckIn.count({ where: { gymId, allowed: true, createdAt: { [Op.gte]: startOfDay(date) } } }),
        canSeeMoney
            ? Payment.findAll({
                where: { gymId, paidAt: { [Op.gte]: startOfDay(startOfMonth(date)) } },
                include: [{ model: Client, as: 'client', attributes: ['id', 'firstName', 'lastName'] }],
                order: [['paidAt', 'DESC']],
            })
            : Promise.resolve([] as Payment[]),
    ])

    const members = clients.map(client => ({ client, membership: summarizeMemberships(client.memberships ?? []) }))
    const count = (state: string) => members.filter(m => m.membership.state === state).length

    const expiringSoon = members
        .filter(m => m.membership.state === 'expiring')
        .sort((a, b) => (a.membership.daysLeft ?? 0) - (b.membership.daysLeft ?? 0))
        .slice(0, 10)
        .map(({ client, membership }) => ({
            id: client.id,
            firstName: client.firstName,
            lastName: client.lastName,
            phone: client.phone,
            expiresOn: membership.expiresOn,
            daysLeft: membership.daysLeft,
        }))

    const todayStart = startOfDay(date)
    const sum = (payments: Payment[]) => payments.reduce((total, p) => total + p.amount, 0)

    res.json({
        data: {
            date,
            members: {
                total: clients.length,
                active: count('active') + count('expiring'),
                expiring: count('expiring'),
                expired: count('expired'),
                none: count('none'),
            },
            checkIns: { today: todayCheckIns },
            expiringSoon,
            revenue: canSeeMoney
                ? {
                    today: sum(monthPayments.filter(p => p.paidAt >= todayStart)),
                    month: sum(monthPayments),
                    byMethod: Object.fromEntries(PAYMENT_METHODS.map(m => [m, sum(monthPayments.filter(p => p.method === m))])),
                    recent: monthPayments.slice(0, 5),
                }
                : null,
        },
    })
})

export default router
