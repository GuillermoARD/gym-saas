import { Sequelize } from 'sequelize'
import { env } from './env'

// En los tests se usa SQLite en memoria para no depender de un Postgres.
// Con DATABASE_URL=sqlite:./ruta.sqlite se puede probar la app en local sin Postgres.
export const sequelize = env.NODE_ENV === 'test'
    ? new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
    : env.DATABASE_URL!.startsWith('sqlite:')
    ? new Sequelize({ dialect: 'sqlite', storage: env.DATABASE_URL!.slice('sqlite:'.length), logging: false })
    : new Sequelize(env.DATABASE_URL!, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: env.DATABASE_SSL === 'true'
            ? { ssl: { require: true, rejectUnauthorized: false } }
            : {},
    })
