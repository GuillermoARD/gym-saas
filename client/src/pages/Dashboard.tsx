import { Link } from 'react-router-dom'
import type { Dashboard as DashboardData, PaymentMethod } from '../api/types'
import { Alert, Badge, Card, EmptyState, Loading, PageHeader } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { formatDate, formatMoney, formatTime, fullName, METHOD_LABELS } from '../utils/format'

function Stat({ label, value, tone, to }: { label: string; value: string | number; tone?: string; to?: string }) {
    const content = (
        <Card className="h-full transition-colors hover:border-brand/40">
            <p className="text-sm text-muted">{label}</p>
            <p className={`mt-2 text-3xl font-extrabold tabular-nums ${tone ?? ''}`}>{value}</p>
        </Card>
    )
    return to ? <Link to={to}>{content}</Link> : content
}

export default function Dashboard() {
    const { user } = useAuth()
    const { data, loading, error } = useApi<{ data: DashboardData }>('/dashboard')

    if (loading) return <Loading />
    if (error || !data) return <Alert>{error}</Alert>

    const d = data.data
    const revenue = d.revenue
    const methodTotal = revenue ? Object.values(revenue.byMethod).reduce((a, b) => a + b, 0) : 0

    return (
        <>
            <PageHeader
                title={`Hola, ${user?.name.split(' ')[0]}`}
                subtitle={`Resumen de ${user?.gym?.name ?? 'tu gimnasio'} · ${formatDate(d.date)}`}
            />

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat label="Miembros activos" value={d.members.active} tone="text-ok" to="/clientes?estado=active" />
                <Stat label="Por vencer (7 dias)" value={d.members.expiring} tone="text-warn" to="/clientes?estado=expiring" />
                <Stat label="Vencidos" value={d.members.expired} tone="text-bad" to="/clientes?estado=expired" />
                <Stat label="Entradas hoy" value={d.checkIns.today} tone="text-brand" />
            </div>

            {revenue && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <Stat label="Ingresos de hoy" value={formatMoney(revenue.today)} to="/pagos" />
                    <Stat label="Ingresos del mes" value={formatMoney(revenue.month)} to="/pagos" />
                </div>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-bold">Membresias por vencer</h2>
                        <Link to="/clientes?estado=expiring" className="text-sm text-brand hover:underline">Ver todas</Link>
                    </div>
                    {d.expiringSoon.length ? (
                        <ul className="divide-y divide-line">
                            {d.expiringSoon.map(c => (
                                <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <Link to={`/clientes/${c.id}`} className="font-medium hover:text-brand">{fullName(c)}</Link>
                                        <p className="text-xs text-muted">{c.phone ?? 'Sin telefono'} · vence {formatDate(c.expiresOn)}</p>
                                    </div>
                                    <Badge tone="warn">{c.daysLeft === 0 ? 'Hoy' : `${c.daysLeft} d`}</Badge>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="Nadie vence esta semana" />
                    )}
                </Card>

                {revenue && (
                    <Card>
                        <h2 className="mb-4 font-bold">Ingresos del mes por metodo</h2>
                        <div className="flex flex-col gap-3">
                            {(Object.keys(revenue.byMethod) as PaymentMethod[]).map(method => {
                                const amount = revenue.byMethod[method]
                                const pct = methodTotal ? (amount / methodTotal) * 100 : 0
                                return (
                                    <div key={method}>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span className="text-muted">{METHOD_LABELS[method]}</span>
                                            <span className="font-semibold tabular-nums">{formatMoney(amount)}</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                                            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <h3 className="mt-6 mb-2 text-sm font-semibold text-muted">Ultimos pagos</h3>
                        {revenue.recent.length ? (
                            <ul className="divide-y divide-line text-sm">
                                {revenue.recent.map(p => (
                                    <li key={p.id} className="flex justify-between gap-3 py-2">
                                        <span className="truncate">{p.client ? fullName(p.client) : '—'} <span className="text-muted">· {formatTime(p.paidAt)}</span></span>
                                        <span className="font-semibold tabular-nums">{formatMoney(p.amount)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted">Todavia no hay pagos este mes.</p>
                        )}
                    </Card>
                )}
            </div>
        </>
    )
}
