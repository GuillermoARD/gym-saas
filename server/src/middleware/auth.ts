import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { Gym, NO_ACCESS_ROLES, User, type Role } from '../models'
import { HttpError } from '../utils/errors'

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: User
            gymId?: number
        }
    }
}

export function signToken(user: User) {
    return jwt.sign({ id: user.id }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    })
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) throw new HttpError(401, 'No autenticado')

    let payload: { id: number }
    try {
        payload = jwt.verify(header.slice(7), env.JWT_SECRET) as { id: number }
    } catch {
        throw new HttpError(401, 'Sesion no valida o expirada')
    }

    const user = await User.findByPk(payload.id, { include: [{ model: Gym, as: 'gym' }] })
    // si le cambian el rol a uno sin acceso, su sesión deja de valer
    if (!user || !user.active || NO_ACCESS_ROLES.includes(user.role)) throw new HttpError(401, 'Usuario no valido')
    if (user.gym && !user.gym.active) throw new HttpError(403, 'Este gimnasio esta desactivado')

    req.user = user
    next()
}

export function requireRole(...roles: Role[]) {
    return (req: Request, _res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            throw new HttpError(403, 'No tienes permiso para esta accion')
        }
        next()
    }
}

/** Todas las rutas del gimnasio quedan limitadas al gymId del usuario */
export function requireGym(req: Request, _res: Response, next: NextFunction) {
    if (!req.user?.gymId) throw new HttpError(403, 'Esta accion requiere pertenecer a un gimnasio')
    req.gymId = req.user.gymId
    next()
}
