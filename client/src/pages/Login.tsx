import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client'
import { Logo } from '../components/Layout'
import { Alert, Button, Field, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="mb-8 flex justify-center"><Logo /></div>
                <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
                    <h1 className="text-xl font-bold">{title}</h1>
                    <p className="mt-1 mb-6 text-sm text-muted">{subtitle}</p>
                    {children}
                </div>
            </div>
        </div>
    )
}

export default function Login() {
    const { user, login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    if (user) return <Navigate to={user.role === 'super_admin' ? '/admin' : '/'} replace />

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        setLoading(true)
        setError('')
        try {
            const logged = await login(String(form.get('email')), String(form.get('password')))
            const from = (location.state as { from?: string } | null)?.from
            navigate(logged.role === 'super_admin' ? '/admin' : from ?? '/', { replace: true })
        } catch (err) {
            setError(errorMessage(err))
            setLoading(false)
        }
    }

    return (
        <AuthShell title="Iniciar sesion" subtitle="Entra para administrar tu gimnasio">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && <Alert>{error}</Alert>}
                <Field label="Email" htmlFor="email">
                    <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
                </Field>
                <Field label="Contraseña" htmlFor="password">
                    <Input id="password" name="password" type="password" autoComplete="current-password" required />
                </Field>
                <Button type="submit" loading={loading} className="mt-2">Entrar</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
                ¿Tienes un gimnasio y no tienes cuenta? <Link to="/registro" className="font-semibold text-brand hover:underline">Registralo gratis</Link>
            </p>
        </AuthShell>
    )
}
