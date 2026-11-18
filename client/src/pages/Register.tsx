import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { errorMessage, fieldErrors } from '../api/client'
import { Alert, Button, Field, Input } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { AuthShell } from './Login'

export default function Register() {
    const { user, register } = useAuth()
    const navigate = useNavigate()
    const [error, setError] = useState('')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)

    if (user) return <Navigate to="/" replace />

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
        setLoading(true)
        setError('')
        setErrors({})
        try {
            await register({
                gymName: form.gymName,
                phone: form.phone || undefined,
                ownerName: form.ownerName,
                email: form.email,
                password: form.password,
            })
            navigate('/planes', { replace: true, state: { welcome: true } })
        } catch (err) {
            setErrors(fieldErrors(err))
            setError(errorMessage(err))
            setLoading(false)
        }
    }

    return (
        <AuthShell title="Registra tu gimnasio" subtitle="Crea la cuenta del dueño. Luego agregas a tu personal.">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && !Object.keys(errors).length && <Alert>{error}</Alert>}
                <Field label="Nombre del gimnasio" htmlFor="gymName" error={errors.gymName}>
                    <Input id="gymName" name="gymName" required autoFocus placeholder="Ej. Iron Box Gym" />
                </Field>
                <Field label="Telefono del gimnasio (opcional)" htmlFor="phone" error={errors.phone}>
                    <Input id="phone" name="phone" type="tel" placeholder="809-555-0100" />
                </Field>
                <Field label="Tu nombre" htmlFor="ownerName" error={errors.ownerName}>
                    <Input id="ownerName" name="ownerName" required autoComplete="name" />
                </Field>
                <Field label="Email" htmlFor="email" error={errors.email}>
                    <Input id="email" name="email" type="email" required autoComplete="email" />
                </Field>
                <Field label="Contraseña" htmlFor="password" error={errors.password} hint="Minimo 8 caracteres">
                    <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
                </Field>
                <Button type="submit" loading={loading} className="mt-2">Crear cuenta</Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
                ¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-brand hover:underline">Inicia sesion</Link>
            </p>
        </AuthShell>
    )
}
