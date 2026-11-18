import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().optional(),
    DATABASE_SSL: z.enum(['true', 'false']).default('false'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
    JWT_EXPIRES_IN: z.string().default('8h'),
    FRONTEND_URL: z.string().default('http://localhost:5173'),
}).refine(env => env.NODE_ENV === 'test' || !!env.DATABASE_URL, {
    message: 'DATABASE_URL es obligatoria fuera de los tests',
    path: ['DATABASE_URL'],
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
    console.error('Variables de entorno no validas:')
    for (const issue of parsed.error.issues) {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
    }
    process.exit(1)
}

export const env = parsed.data
