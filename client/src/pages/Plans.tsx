import { useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { api, errorMessage, fieldErrors } from '../api/client'
import type { Plan } from '../api/types'
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Loading, Modal, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { formatMoney } from '../utils/format'

function PlanForm({ plan, onSaved, onCancel }: { plan?: Plan; onSaved: () => void; onCancel: () => void }) {
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
            if (plan) await api.put(`/plans/${plan.id}`, { ...data, active: plan.active })
            else await api.post('/plans', data)
            onSaved()
        } catch (err) {
            setErrors(fieldErrors(err))
            setError(errorMessage(err))
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && !Object.keys(errors).length && <Alert>{error}</Alert>}
            <Field label="Nombre" htmlFor="name" error={errors.name}>
                <Input id="name" name="name" defaultValue={plan?.name} required autoFocus placeholder="Ej. Mensual" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
                <Field label="Precio (RD$)" htmlFor="price" error={errors.price}>
                    <Input id="price" name="price" type="number" min="1" step="0.01" defaultValue={plan?.price} required />
                </Field>
                <Field label="Duracion (dias)" htmlFor="durationDays" error={errors.durationDays} hint="30 = mensual, 1 = pase diario">
                    <Input id="durationDays" name="durationDays" type="number" min="1" defaultValue={plan?.durationDays ?? 30} required />
                </Field>
            </div>
            <Field label="Descripcion (opcional)" htmlFor="description" error={errors.description}>
                <Input id="description" name="description" defaultValue={plan?.description ?? ''} placeholder="Ej. Acceso ilimitado" />
            </Field>
            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" loading={loading}>{plan ? 'Guardar' : 'Crear plan'}</Button>
            </div>
        </form>
    )
}

export default function Plans() {
    const { user } = useAuth()
    const location = useLocation()
    const isOwner = user?.role === 'owner'
    const { data, loading, error, reload } = useApi<{ data: Plan[] }>(isOwner ? '/plans?all=true' : '/plans')
    const [editing, setEditing] = useState<Plan | 'new' | null>(null)
    const [actionError, setActionError] = useState('')
    const welcome = !!(location.state as { welcome?: boolean } | null)?.welcome

    const toggleActive = async (plan: Plan) => {
        setActionError('')
        try {
            if (plan.active) await api.delete(`/plans/${plan.id}`)
            else await api.put(`/plans/${plan.id}`, { ...plan, active: true })
            reload()
        } catch (err) {
            setActionError(errorMessage(err))
        }
    }

    const plans = data?.data ?? []

    return (
        <>
            <PageHeader
                title="Planes"
                subtitle="Las membresias que vendes en tu gimnasio"
                actions={isOwner && <Button onClick={() => setEditing('new')}>+ Nuevo plan</Button>}
            />

            {welcome && !plans.length && (
                <div className="mb-6"><Alert tone="ok">¡Bienvenido! Empieza creando tus planes (mensual, trimestral, pase diario...).</Alert></div>
            )}
            {(error || actionError) && <div className="mb-4"><Alert>{error || actionError}</Alert></div>}

            {loading && !data ? <Loading /> : plans.length === 0 ? (
                <EmptyState title="No hay planes">{isOwner ? 'Crea tu primer plan para poder vender membresias.' : 'El dueño todavia no ha creado planes.'}</EmptyState>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map(plan => (
                        <Card key={plan.id} className={plan.active ? '' : 'opacity-60'}>
                            <div className="flex items-start justify-between gap-2">
                                <h2 className="text-lg font-bold">{plan.name}</h2>
                                {!plan.active && <Badge>Inactivo</Badge>}
                            </div>
                            <p className="mt-2 text-3xl font-extrabold text-brand tabular-nums">{formatMoney(plan.price)}</p>
                            <p className="mt-1 text-sm text-muted">{plan.durationDays} {plan.durationDays === 1 ? 'dia' : 'dias'}</p>
                            {plan.description && <p className="mt-3 text-sm">{plan.description}</p>}
                            {isOwner && (
                                <div className="mt-5 flex gap-2">
                                    <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setEditing(plan)}>Editar</Button>
                                    <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => toggleActive(plan)}>
                                        {plan.active ? 'Desactivar' : 'Activar'}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo plan' : 'Editar plan'}>
                {editing !== null && (
                    <PlanForm
                        plan={editing === 'new' ? undefined : editing}
                        onCancel={() => setEditing(null)}
                        onSaved={() => { setEditing(null); reload() }}
                    />
                )}
            </Modal>
        </>
    )
}
