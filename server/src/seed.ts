/**
 * npm run seed            -> crea el super admin (SUPERADMIN_* del .env)
 * npm run seed -- --demo  -> además crea un gimnasio de prueba con planes, clientes y pagos
 */
import bcrypt from 'bcrypt'
import { sequelize } from './config/db'
import { Client, Gym, Membership, Payment, Plan, User } from './models'
import { addDays, today } from './utils/dates'

async function createSuperAdmin() {
    const email = process.env.SUPERADMIN_EMAIL?.toLowerCase()
    const password = process.env.SUPERADMIN_PASSWORD
    if (!email || !password) {
        console.log('SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD no definidos, se omite el super admin')
        return
    }
    if (await User.findOne({ where: { email } })) {
        console.log(`Super admin ${email} ya existe`)
        return
    }
    await User.create({
        gymId: null,
        name: process.env.SUPERADMIN_NAME ?? 'Super Admin',
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'super_admin',
    })
    console.log(`Super admin creado: ${email}`)
}

async function createDemoGym() {
    const ownerEmail = 'guilledone@gmail.com'
    if (await User.findOne({ where: { email: ownerEmail } })) {
        console.log('El gimnasio demo ya existe')
        return
    }

    const passwordHash = await bcrypt.hash('demo12345', 10)
    const gym = await Gym.create({ name: 'Iron Box Demo', slug: 'iron-box-demo', phone: '809-555-0100', address: 'Santo Domingo' })
    const owner = await User.create({ gymId: gym.id, name: 'Dueño Demo', email: ownerEmail, passwordHash: await bcrypt.hash('12345', 10), role: 'owner' })
    await User.create({ gymId: gym.id, name: 'Recepcion Demo', email: 'recepcion@demo.do', passwordHash, role: 'reception' })

    const [monthly, quarterly] = await Plan.bulkCreate([
        { gymId: gym.id, name: 'Mensual', price: 1500, durationDays: 30, description: 'Acceso ilimitado por 30 dias' },
        { gymId: gym.id, name: 'Trimestral', price: 4000, durationDays: 90, description: 'Ahorra RD$500' },
        { gymId: gym.id, name: 'Pase diario', price: 200, durationDays: 1 },
    ])

    const names: [string, string, number][] = [
        ['Juan', 'Perez', 20], ['Maria', 'Rodriguez', 3], ['Carlos', 'Santana', -5],
        ['Ana', 'Martinez', 60], ['Luis', 'Gomez', 1], ['Rosa', 'Feliz', 0],
    ]
    const date = today()

    for (const [firstName, lastName, daysLeft] of names) {
        const client = await Client.create({ gymId: gym.id, firstName, lastName, phone: '809-555-0101' })
        const plan = daysLeft > 30 ? quarterly : monthly
        const endDate = addDays(date, daysLeft)
        const membership = await Membership.create({
            gymId: gym.id, clientId: client.id, planId: plan.id,
            startDate: addDays(endDate, -(plan.durationDays - 1)), endDate, price: plan.price,
        })
        await Payment.create({
            gymId: gym.id, clientId: client.id, membershipId: membership.id,
            amount: plan.price, method: daysLeft % 2 ? 'cash' : 'transfer', receivedById: owner.id,
        })
    }
    await Client.create({ gymId: gym.id, firstName: 'Pedro', lastName: 'Sin Plan' })

    console.log('Gimnasio demo creado -> guilledone@gmail.com (password: 12345) / recepcion@demo.do (password: demo12345)')
}

async function main() {
    await sequelize.authenticate()
    await sequelize.sync()
    await createSuperAdmin()
    if (process.argv.includes('--demo')) await createDemoGym()
    await sequelize.close()
}

main().catch(error => {
    console.error(error)
    process.exit(1)
})
