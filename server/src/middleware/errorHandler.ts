import type { NextFunction, Request, Response } from 'express'
import { UniqueConstraintError } from 'sequelize'
import { ZodError } from 'zod'
import { HttpError } from '../utils/errors'

export function notFound(_req: Request, res: Response) {
    res.status(404).json({ error: 'Ruta no encontrada' })
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Datos no validos',
            errors: err.issues.map(issue => ({
                field: issue.path.map(String).join('.'),
                message: issue.message,
            })),
        })
    }

    if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message })
    }

    if (err instanceof UniqueConstraintError) {
        return res.status(409).json({ error: 'Ya existe un registro con esos datos' })
    }

    if (typeof err === 'object' && err && 'type' in err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON no valido' })
    }

    console.error(err)
    res.status(500).json({ error: 'Error interno del servidor' })
}
