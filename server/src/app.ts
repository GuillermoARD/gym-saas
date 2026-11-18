import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { env } from './config/env'
import { authenticate, requireGym } from './middleware/auth'
import { errorHandler, notFound } from './middleware/errorHandler'
import adminRoutes from './routes/admin'
import authRoutes from './routes/auth'
import checkInRoutes from './routes/checkins'
import clientRoutes from './routes/clients'
import dashboardRoutes from './routes/dashboard'
import membershipRoutes from './routes/memberships'
import paymentRoutes from './routes/payments'
import planRoutes from './routes/plans'
import staffRoutes from './routes/staff'

export const app = express()

app.use(cors({ origin: env.FRONTEND_URL }))
app.use(express.json({ limit: '100kb' }))
if (env.NODE_ENV === 'development') app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin', authenticate, adminRoutes)

// Todo lo de abajo queda limitado al gimnasio del usuario
const gymRouter = express.Router()
gymRouter.use(authenticate, requireGym)
gymRouter.use('/dashboard', dashboardRoutes)
gymRouter.use('/staff', staffRoutes)
gymRouter.use('/plans', planRoutes)
gymRouter.use('/clients', clientRoutes)
gymRouter.use('/memberships', membershipRoutes)
gymRouter.use('/payments', paymentRoutes)
gymRouter.use('/checkins', checkInRoutes)
app.use('/api', gymRouter)

app.use(notFound)
app.use(errorHandler)
