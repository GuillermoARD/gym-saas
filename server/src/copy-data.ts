// Copia todos los datos de una base SQLite (por ejemplo showcase.sqlite) a la base de DATABASE_URL.
//
// Uso (PowerShell), con el link de Neon:
//   $env:DATABASE_URL="postgresql://..."; $env:DATABASE_SSL="true"; npm run copy-data -- ./showcase.sqlite
//
// Por seguridad no hace nada si la base de destino ya tiene gimnasios.
import { Sequelize, DataTypes, QueryTypes, type ModelStatic, type Model } from 'sequelize'
import { sequelize } from './config/db'
import { Gym, User, Plan, Client, Membership, Payment, CheckIn } from './models'

// En este orden, para que cada fila encuentre a su "padre" (gimnasio → usuario → cliente → ...)
const MODELS: ModelStatic<Model>[] = [Gym, User, Plan, Client, Membership, Payment, CheckIn]

async function main() {
    const sourcePath = process.argv[2]
    if (!sourcePath) {
        console.error('Falta la ruta del SQLite de origen. Ejemplo: npm run copy-data -- ./showcase.sqlite')
        process.exit(1)
    }

    const source = new Sequelize({ dialect: 'sqlite', storage: sourcePath, logging: false })

    await sequelize.authenticate()
    await sequelize.sync()

    if (await Gym.count() > 0) {
        console.error('La base de destino ya tiene datos. No copio nada para no duplicar ni pisar nada.')
        process.exit(1)
    }

    await sequelize.transaction(async transaction => {
        for (const model of MODELS) {
            const rows = await source.query<Record<string, unknown>>(
                `SELECT * FROM \`${model.getTableName()}\``, { type: QueryTypes.SELECT })

            // SQLite guarda los booleanos como 0/1; Postgres los quiere como true/false
            const booleans = Object.entries(model.getAttributes())
                .filter(([, attr]) => attr.type instanceof DataTypes.BOOLEAN)
                .map(([name]) => name)
            for (const row of rows) {
                for (const name of booleans) {
                    if (row[name] !== null && row[name] !== undefined) row[name] = Boolean(row[name])
                }
            }

            await model.bulkCreate(rows, { hooks: false, validate: false, transaction })
            console.log(`  ${model.getTableName()}: ${rows.length} filas`)
        }
    })

    // Los ids se copiaron tal cual; el contador de Postgres tiene que seguir desde el más alto
    if (sequelize.getDialect() === 'postgres') {
        for (const model of MODELS) {
            const table = model.getTableName() as string
            await sequelize.query(
                `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`)
        }
    }

    await source.close()
    await sequelize.close()
    console.log('Listo: datos copiados.')
}

main().catch(error => {
    console.error('Falló la copia:', error)
    process.exit(1)
})
