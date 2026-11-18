import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { PaymentMethod, PaymentsResponse } from '../api/types'
import { Alert, Badge, Card, EmptyState, Field, Input, Loading, PageHeader, Select } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { formatDateTime, formatMoney, fullName, METHOD_LABELS, todayISO } from '../utils/format'

export default function Payments() {
    const today = todayISO()
    const [from, setFrom] = useState(`${today.slice(0, 8)}01`)
    const [to, setTo] = useState(today)
    const [method, setMethod] = useState<PaymentMethod | ''>('')

    const qs = new URLSearchParams({ from, to, ...(method ? { method } : {}) })
    const { data, loading, error } = useApi<PaymentsResponse>(from && to ? `/payments?${qs}` : null)

    return (
        <>
            <PageHeader title="Pagos" subtitle="Cuadre de caja e historial de cobros" />

            <Card className="mb-6">
                <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Desde" htmlFor="from">
                        <Input id="from" type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} />
                    </Field>
                    <Field label="Hasta" htmlFor="to">
                        <Input id="to" type="date" value={to} min={from} onChange={e => setTo(e.target.value)} />
                    </Field>
                    <Field label="Metodo" htmlFor="method">
                        <Select id="method" value={method} onChange={e => setMethod(e.target.value as PaymentMethod | '')}>
                            <option value="">Todos</option>
                            {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
                        </Select>
                    </Field>
                </div>
            </Card>

            {error && <Alert>{error}</Alert>}
            {loading && !data ? <Loading /> : data && (
                <>
                    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Card>
                            <p className="text-sm text-muted">Total ({data.summary.count} pagos)</p>
                            <p className="mt-2 text-2xl font-extrabold text-brand tabular-nums">{formatMoney(data.summary.total)}</p>
                        </Card>
                        {(Object.keys(data.summary.byMethod) as PaymentMethod[]).map(m => (
                            <Card key={m}>
                                <p className="text-sm text-muted">{METHOD_LABELS[m]}</p>
                                <p className="mt-2 text-2xl font-extrabold tabular-nums">{formatMoney(data.summary.byMethod[m])}</p>
                            </Card>
                        ))}
                    </div>

                    {data.data.length === 0 ? (
                        <EmptyState title="No hay pagos en ese rango" />
                    ) : (
                        <Card className="overflow-hidden p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Fecha</th>
                                            <th className="px-4 py-3 font-semibold">Cliente</th>
                                            <th className="px-4 py-3 font-semibold">Metodo</th>
                                            <th className="hidden px-4 py-3 font-semibold md:table-cell">Cobro</th>
                                            <th className="px-4 py-3 text-right font-semibold">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                        {data.data.map(p => (
                                            <tr key={p.id}>
                                                <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDateTime(p.paidAt)}</td>
                                                <td className="px-4 py-3">
                                                    {p.client ? <Link to={`/clientes/${p.client.id}`} className="hover:text-brand">{fullName(p.client)}</Link> : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge>{METHOD_LABELS[p.method]}</Badge>
                                                    {p.reference && <span className="ml-2 text-xs text-muted">{p.reference}</span>}
                                                </td>
                                                <td className="hidden px-4 py-3 text-muted md:table-cell">{p.receivedBy?.name ?? '—'}</td>
                                                <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(p.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </>
            )}
        </>
    )
}
