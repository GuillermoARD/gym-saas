import { useState, type FormEvent } from 'react'
import { api, errorMessage, fieldErrors } from '../api/client'
import type { Client } from '../api/types'
import { Alert, Button, Field, Input, Textarea } from './ui'

type ClientFormProps = {
    client?: Client
    onSaved: (client: Client) => void
    onCancel: () => void
}

/** Formulario reutilizable para crear y editar clientes */
export default function ClientForm({ client, onSaved, onCancel }: ClientFormProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const data = Object.fromEntries(new FormData(e.currentTarget))
        setLoading(true)
        setErrors({})
        setError('')
        try {
            const res = client
                ? await api.put<{ data: Client }>(`/clients/${client.id}`, data)
                : await api.post<{ data: Client }>('/clients', data)
            onSaved(res.data.data)
        } catch (err) {
            setErrors(fieldErrors(err))
            setError(errorMessage(err))
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && !Object.keys(errors).length && <Alert>{error}</Alert>}
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre" htmlFor="firstName" error={errors.firstName}>
                    <Input id="firstName" name="firstName" defaultValue={client?.firstName} required autoFocus />
                </Field>
                <Field label="Apellido" htmlFor="lastName" error={errors.lastName}>
                    <Input id="lastName" name="lastName" defaultValue={client?.lastName} required />
                </Field>
                <Field label="Telefono / WhatsApp" htmlFor="phone" error={errors.phone}>
                    <Input id="phone" name="phone" type="tel" defaultValue={client?.phone ?? ''} placeholder="809-555-0101" />
                </Field>
                <Field label="Cedula" htmlFor="documentId" error={errors.documentId}>
                    <Input id="documentId" name="documentId" defaultValue={client?.documentId ?? ''} placeholder="001-0000000-0" />
                </Field>
                <Field label="Email" htmlFor="email" error={errors.email}>
                    <Input id="email" name="email" type="email" defaultValue={client?.email ?? ''} />
                </Field>
                <Field label="Fecha de nacimiento" htmlFor="birthDate" error={errors.birthDate}>
                    <Input id="birthDate" name="birthDate" type="date" defaultValue={client?.birthDate ?? ''} />
                </Field>
            </div>
            <Field label="Notas" htmlFor="notes" error={errors.notes} hint="Lesiones, condiciones medicas, objetivos...">
                <Textarea id="notes" name="notes" defaultValue={client?.notes ?? ''} />
            </Field>
            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" loading={loading}>{client ? 'Guardar cambios' : 'Registrar cliente'}</Button>
            </div>
        </form>
    )
}
