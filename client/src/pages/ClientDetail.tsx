import { useState, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api, errorMessage } from '../api/client'
import type { ClientDetail as ClientDetailData } from '../api/types'
import ClientForm from '../components/ClientForm'
import MemberCard from '../components/MemberCard'
import MembershipBadge from '../components/MembershipBadge'
import QrCode from '../components/QrCode'
import SellMembershipForm from '../components/SellMembershipForm'
import { Alert, Badge, Button, Card, EmptyState, Loading, Modal } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { formatDate, formatDateTime, formatMoney, fullName, METHOD_LABELS } from '../utils/format'

function Info({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-0.5 text-sm">{children || '—'}</dd>
        </div>
    )
}

export default function ClientDetail() {
    const { id } = useParams()
    const location = useLocation()
    const { user } = useAuth()
    const { data, loading, error, reload } = useApi<{ data: ClientDetailData }>(`/clients/${id}`)

    const [editing, setEditing] = useState(false)
    const [printing, setPrinting] = useState(false)
    // al crear un cliente se abre directo la venta de membresía
    const [selling, setSelling] = useState(() => !!(location.state as { sell?: boolean } | null)?.sell)
    const [notice, setNotice] = useState('')
    const [actionError, setActionError] = useState('')

    if (loading && !data) return <Loading />
    if (error || !data) return <Alert>{error || 'Cliente no encontrado'}</Alert>

    const client = data.data
    const canWrite = user?.role === 'owner' || user?.role === 'reception'
    const isOwner = user?.role === 'owner'

    const run = async (action: () => Promise<unknown>, success: string) => {
        setActionError('')
        try {
            await action()
            setNotice(success)
            reload()
        } catch (err) {
            setActionError(errorMessage(err))
        }
    }

    const regenerateQr = () => {
        if (!confirm('El carnet actual dejara de funcionar. ¿Generar un codigo nuevo?')) return
        run(() => api.post(`/clients/${client.id}/regenerate-qr`), 'Codigo QR regenerado')
    }

    const cancelMembership = (membershipId: number) => {
        if (!confirm('¿Cancelar esta membresia? El pago queda registrado.')) return
        run(() => api.patch(`/memberships/${membershipId}/cancel`), 'Membresia cancelada')
    }

    return (
        <>
            <Link to="/clientes" className="text-sm text-muted hover:text-brand">← Clientes</Link>

            <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{fullName(client)}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <MembershipBadge membership={client.membership} />
                        {client.membership.expiresOn && (
                            <span className="text-sm text-muted">
                                {client.membership.state === 'expired' ? 'Vencio' : 'Vence'} el {formatDate(client.membership.expiresOn)}
                            </span>
                        )}
                        {!client.active && <Badge tone="bad">Desactivado</Badge>}
                    </div>
                </div>
                {canWrite && (
                    <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => setEditing(true)}>Editar</Button>
                        <Button onClick={() => setSelling(true)} disabled={!client.active}>
                            {client.membership.state === 'none' ? 'Vender membresia' : 'Renovar'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="mb-4 flex flex-col gap-3">
                {notice && <Alert tone="ok">{notice}</Alert>}
                {actionError && <Alert>{actionError}</Alert>}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <h2 className="mb-4 font-bold">Datos</h2>
                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <Info label="Telefono">{client.phone}</Info>
                        <Info label="Cedula">{client.documentId}</Info>
                        <Info label="Email">{client.email}</Info>
                        <Info label="Nacimiento">{client.birthDate && formatDate(client.birthDate)}</Info>
                        <Info label="Cliente desde">{formatDate(client.createdAt)}</Info>
                    </dl>
                    {client.notes && (
                        <div className="mt-4 rounded-lg bg-surface-2 p-3 text-sm whitespace-pre-line">
                            <span className="text-xs text-muted">Notas</span>
                            <p className="mt-1">{client.notes}</p>
                        </div>
                    )}
                </Card>

                <Card>
                    <h2 className="mb-1 font-bold">Carnet</h2>
                    <p className="mb-4 text-xs text-muted">Escanea este QR en la pantalla de check-in.</p>
                    <div className="flex justify-center">
                        <QrCode value={client.qrCode} size={180} className="p-2" />
                    </div>
                    <code className="mt-3 block text-center text-[10px] break-all text-muted">{client.qrCode}</code>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                        <Button className="px-3 py-1.5 text-xs" onClick={() => setPrinting(true)}>Imprimir carnet</Button>
                        <Button
                            variant="secondary"
                            className="px-3 py-1.5 text-xs"
                            onClick={() => navigator.clipboard.writeText(client.qrCode).then(() => setNotice('Codigo copiado'))}
                        >Copiar codigo</Button>
                        {canWrite && <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={regenerateQr}>Regenerar</Button>}
                    </div>
                </Card>

                <Card className="lg:col-span-2">
                    <h2 className="mb-4 font-bold">Membresias</h2>
                    {client.memberships.length ? (
                        <ul className="divide-y divide-line">
                            {client.memberships.map(m => (
                                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                                    <div>
                                        <p className="font-medium">{m.plan?.name ?? 'Plan'} · {formatMoney(m.price)}</p>
                                        <p className="text-xs text-muted">{formatDate(m.startDate)} → {formatDate(m.endDate)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {m.status === 'cancelled' && <Badge tone="bad">Cancelada</Badge>}
                                        {isOwner && m.status === 'active' && (
                                            <button onClick={() => cancelMembership(m.id)} className="text-xs text-muted hover:text-bad cursor-pointer">Cancelar</button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="Sin membresias todavia" />
                    )}

                    {canWrite && (
                        <>
                            <h2 className="mt-8 mb-4 font-bold">Pagos</h2>
                            {client.payments.length ? (
                                <ul className="divide-y divide-line">
                                    {client.payments.map(p => (
                                        <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                                            <div>
                                                <p className="font-medium tabular-nums">{formatMoney(p.amount)}</p>
                                                <p className="text-xs text-muted">
                                                    {formatDateTime(p.paidAt)}{p.receivedBy ? ` · cobro ${p.receivedBy.name}` : ''}
                                                    {p.reference ? ` · ref. ${p.reference}` : ''}
                                                </p>
                                            </div>
                                            <Badge>{METHOD_LABELS[p.method]}</Badge>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <EmptyState title="Sin pagos registrados" />
                            )}
                        </>
                    )}
                </Card>

                <Card>
                    <h2 className="mb-4 font-bold">Ultimas entradas</h2>
                    {client.checkIns.length ? (
                        <ul className="divide-y divide-line text-sm">
                            {client.checkIns.map(c => (
                                <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                                    <span className="text-muted">{formatDateTime(c.createdAt)}</span>
                                    {c.allowed ? <Badge tone="ok">Entro</Badge> : <Badge tone="bad">{c.reason ?? 'Rechazado'}</Badge>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="Todavia no ha entrado" />
                    )}
                </Card>
            </div>

            <Modal open={printing} onClose={() => setPrinting(false)} title="Carnet del cliente">
                <MemberCard client={client} gymName={user?.gym?.name ?? 'Gimnasio'} />
                <p className="mt-4 text-center text-xs text-muted">
                    Tamaño tarjeta de credito. En la ventana de impresion activa "Graficos de fondo" para que salgan los colores.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setPrinting(false)}>Cerrar</Button>
                    <Button onClick={() => window.print()}>Imprimir</Button>
                </div>
            </Modal>

            <Modal open={editing} onClose={() => setEditing(false)} title="Editar cliente">
                <ClientForm
                    client={client}
                    onCancel={() => setEditing(false)}
                    onSaved={() => { setEditing(false); setNotice('Datos actualizados'); reload() }}
                />
            </Modal>

            <Modal open={selling} onClose={() => setSelling(false)} title={`Membresia para ${client.firstName}`}>
                <SellMembershipForm
                    client={client}
                    onCancel={() => setSelling(false)}
                    onSold={() => { setSelling(false); setNotice('Pago registrado y membresia activada'); reload() }}
                />
            </Modal>
        </>
    )
}
