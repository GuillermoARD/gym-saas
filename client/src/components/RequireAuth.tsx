import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { Loading } from './ui'

/** Protege rutas: pide sesión y, opcionalmente, ciertos roles */
export default function RequireAuth({ roles }: { roles?: Role[] }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) return <Loading />
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
    if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'super_admin' ? '/admin' : '/'} replace />

    return <Outlet />
}
