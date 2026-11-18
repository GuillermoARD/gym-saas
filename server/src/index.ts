import { app } from './app'
import { env } from './config/env'
import { sequelize } from './config/db'
import './models'

async function main() {
    try {
        await sequelize.authenticate()
        // en desarrollo, alter mantiene las tablas al día con los modelos.
        // En SQLite no: alter recrea las tablas y las claves foráneas borran los datos.
        await sequelize.sync({ alter: env.NODE_ENV === 'development' && sequelize.getDialect() === 'postgres' })
        console.log('Base de datos conectada')
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error)
        process.exit(1)
    }

    app.listen(env.PORT, () => {
        console.log(`API escuchando en http://localhost:${env.PORT}`)
    })
}

main()
