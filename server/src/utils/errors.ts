import { z } from 'zod'

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message)
    }
}

const idSchema = z.coerce.number().int().positive()

/** Convierte un parámetro de ruta en id numérico o lanza 400 */
export function parseId(value: unknown): number {
    const result = idSchema.safeParse(value)
    if (!result.success) throw new HttpError(400, 'ID no valido')
    return result.data
}
