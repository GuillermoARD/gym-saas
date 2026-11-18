import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import { api, TOKEN_KEY } from '../api/client'
import type { User } from '../api/types'

type RegisterData = {
    gymName: string
    phone?: string
    ownerName: string
    email: string
    password: string
}

type AuthContextValue = {
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<User>
    register: (data: RegisterData) => Promise<User>
    logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY))

    const logout = useCallback(() => {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
    }, [])

    // Restaurar la sesión al recargar la página
    useEffect(() => {
        if (!localStorage.getItem(TOKEN_KEY)) return
        api.get<{ user: User }>('/auth/me')
            .then(res => setUser(res.data.user))
            .catch(() => logout())
            .finally(() => setLoading(false))
    }, [logout])

    useEffect(() => {
        window.addEventListener('auth:logout', logout)
        return () => window.removeEventListener('auth:logout', logout)
    }, [logout])

    const saveSession = (token: string, user: User) => {
        localStorage.setItem(TOKEN_KEY, token)
        setUser(user)
        return user
    }

    const login = async (email: string, password: string) => {
        const { data } = await api.post<{ token: string; user: User }>('/auth/login', { email, password })
        return saveSession(data.token, data.user)
    }

    const register = async (form: RegisterData) => {
        const { data } = await api.post<{ token: string; user: User }>('/auth/register', form)
        return saveSession(data.token, data.user)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
    return ctx
}
