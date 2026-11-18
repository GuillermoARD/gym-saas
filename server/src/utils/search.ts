import { Op, type WhereOptions } from 'sequelize'
import { sequelize } from '../config/db'

/**
 * Cada palabra de la búsqueda tiene que aparecer en alguno de los campos.
 * Así "juan perez" encuentra a Juan Pérez aunque nombre y apellido estén separados.
 */
export function searchWhere(search: string, fields: string[]): WhereOptions {
    const like = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like
    const terms = search.trim().split(/\s+/).filter(Boolean).slice(0, 5)

    return {
        [Op.and]: terms.map(term => ({
            [Op.or]: fields.map(field => ({ [field]: { [like]: `%${term}%` } })),
        })),
    }
}
