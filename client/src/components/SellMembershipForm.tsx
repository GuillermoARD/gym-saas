import { useState, type FormEvent } from 'react'
import { api, errorMessage, fieldErrors } from '../api/client'
import type { Client, PaymentMethod, Plan } from '../api/types'
import { useApi } from '../hooks/useApi'
import { formatDate, formatMoney, METHOD_LABELS, todayISO } from '../utils/format'
import { Alert, Button, EmptyState, Field, Input, Loading, Select } from './ui'

type Props = {
    client: Client
    onSold: () => void
    onCancel: () => void
}

function addDays(date: string, days: number) {
    const d = new Date(`${date}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
}

export default function SellMembershipForm({ client, onSold, onCancel }: Props) {
    const { data, loading: loadingPlans } = useApi<{ data: Plan[] }>('/plans')
    const plans = data?.data ?? []

    const [planId, setPlanId] = useState('')
    const [method, setMethod] = useState<PaymentMethod>('cash')
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const plan = plans.find(p => String(p.id) === planId)

    // Igual que en el server: si todavía tiene días, la renovación empieza al terminar
    const { expiresOn } = client.membership
    const start = expiresOn && expiresOn >= todayISO() ? addDays(expiresOn, 1) : todayISO()

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
        setLoading(true)
        setErrors({})
        setError('')
        try {
            await api.post(`/clients/${client.id}/memberships`, {
                planId: Number(form.planId),
                payment: {
                    method: form.method,
                    amount: form.amount ? Number(form.amount) : undefined,
                    reference: form.reference || undefined,
                },
            })
            onSold()
        } catch (err) {
            setErrors(fieldErrors(err))
            setError(errorMessage(err))
            setLoading(false)
        }
    }

    if (loadingPlans) return <Loading />
    if (!plans.length) return <EmptyState title="No hay planes activos">El dueño debe crear al menos un plan en la seccion Planes.</EmptyState>

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <Alert>{error}</Alert>}

            <Field label="Plan" htmlFor="planId" error={errors.planId}>
                <Select id="planId" name="planId" value={planId} onChange={e => setPlanId(e.target.value)} required>
                    <option value="" disabled>Selecciona un plan</option>
                    {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {formatMoney(p.price)} ({p.durationDays} {p.durationDays === 1 ? 'dia' : 'dias'})</option>
                    ))}
                </Select>
            </Field>

            {plan && (
                <p className="rounded-lg bg-surface-2 px-4 py-3 text-sm text-muted">
                    Vigencia: <span className="text-ink">{formatDate(start)}</span> al{' '}
                    <span className="text-ink">{formatDate(addDays(start, plan.durationDays - 1))}</span>
                    {start !== todayISO() && ' (empieza cuando termine la actual)'}
                </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Metodo de pago" htmlFor="method" error={errors['payment.method']}>
                    <Select id="method" name="method" value={method} onChange={e => setMethod(e.target.value as PaymentMethod)}>
                        {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map(m => (
                            <option key={m} value={m}>{METHOD_LABELS[m]}</option>
                        ))}
                    </Select>
                </Field>
                <Field label="Monto cobrado" htmlFor="amount" error={errors['payment.amount']} hint="Vacio = precio del plan">
                    <Input id="amount" name="amount" type="number" min="1" step="0.01" placeholder={plan ? String(plan.price) : ''} />
                </Field>
            </div>

            {method !== 'cash' && (
                <Field label="Referencia" htmlFor="reference" hint="No. de transferencia o del voucher">
                    <Input id="reference" name="reference" placeholder="Ej. BHD-123456" />
                </Field>
            )}

            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" loading={loading} disabled={!plan}>
                    Registrar pago y activar
                </Button>
            </div>
        </form>
    )
}
