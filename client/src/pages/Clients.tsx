import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Client, MembershipState } from '../api/types'
import ClientForm from '../components/ClientForm'
import MembershipBadge from '../components/MembershipBadge'
import { Alert, Button, Card, EmptyState, Input, Loading, Modal, PageHeader, Select } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { formatDate, fullName, STATE_LABELS } from '../utils/format'

export default function Clients() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [params, setParams] = useSearchParams()
    const state = (params.get('estado') ?? '') as MembershipState | ''
    const [search, setSearch] = useState(params.get('q') ?? '')
    const [query, setQuery] = useState(search)
    const [creating, setCreating] = useState(false)

    // espera a que el usuario deje de escribir antes de buscar
    useEffect(() => {
        const timer = setTimeout(() => setQuery(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    const qs = new URLSearchParams()
    if (query.trim()) qs.set('search', query.trim())
    if (state) qs.set('state', state)
    const { data, loading, error } = useApi<{ data: Client[] }>(`/clients?${qs}`)

    const canWrite = user?.role === 'owner' || user?.role === 'reception'
    const clients = data?.data ?? []

    const setState = (value: string) => {
        const next = new URLSearchParams(params)
        if (value) next.set('estado', value)
        else next.delete('estado')
        setParams(next, { replace: true })
    }

    return (
        <>
            <PageHeader
                title="Clientes"
                subtitle={data ? `${clients.length} ${clients.length === 1 ? 'cliente' : 'clientes'}` : undefined}
                actions={canWrite && <Button onClick={() => setCreating(true)}>+ Nuevo cliente</Button>}
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre, telefono, cedula o email"
                    aria-label="Buscar clientes"
                />
                <Select value={state} onChange={e => setState(e.target.value)} aria-label="Filtrar por estado" className="sm:w-52">
                    <option value="">Todos los estados</option>
                    {(Object.keys(STATE_LABELS) as MembershipState[]).map(s => (
                        <option key={s} value={s}>{STATE_LABELS[s]}</option>
                    ))}
                </Select>
            </div>

            {error && <Alert>{error}</Alert>}
            {loading && !data ? <Loading /> : clients.length === 0 ? (
                <EmptyState title={query || state ? 'No hay clientes con ese filtro' : 'Todavia no tienes clientes'}>
                    {canWrite && !query && !state && 'Registra el primero con el boton "Nuevo cliente".'}
                </EmptyState>
            ) : (
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-line bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Cliente</th>
                                    <th className="hidden px-4 py-3 font-semibold sm:table-cell">Telefono</th>
                                    <th className="px-4 py-3 font-semibold">Membresia</th>
                                    <th className="hidden px-4 py-3 font-semibold md:table-cell">Vence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {clients.map(c => (
                                    <tr key={c.id} className="hover:bg-surface-2/50">
                                        <td className="px-4 py-3">
                                            <Link to={`/clientes/${c.id}`} className="font-medium hover:text-brand">{fullName(c)}</Link>
                                            {c.documentId && <p className="text-xs text-muted">{c.documentId}</p>}
                                        </td>
                                        <td className="hidden px-4 py-3 text-muted sm:table-cell">{c.phone ?? '—'}</td>
                                        <td className="px-4 py-3"><MembershipBadge membership={c.membership} /></td>
                                        <td className="hidden px-4 py-3 text-muted md:table-cell">{formatDate(c.membership.expiresOn)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo cliente">
                <ClientForm
                    onCancel={() => setCreating(false)}
                    onSaved={client => navigate(`/clientes/${client.id}`, { state: { sell: true } })}
                />
            </Modal>
        </>
    )
}
