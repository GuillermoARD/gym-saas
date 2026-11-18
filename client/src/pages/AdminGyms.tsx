import { useState } from 'react'
import { api, errorMessage } from '../api/client'
import type { AdminGym } from '../api/types'
import { Alert, Badge, Button, Card, EmptyState, Loading, PageHeader } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { formatDate } from '../utils/format'

/** Panel del super admin: todos los gimnasios registrados */
export default function AdminGyms() {
    const { data, loading, error, reload } = useApi<{ data: AdminGym[] }>('/admin/gyms')
    const [actionError, setActionError] = useState('')

    const toggle = async (gym: AdminGym) => {
        if (gym.active && !confirm(`¿Desactivar ${gym.name}? Su personal no podra entrar.`)) return
        setActionError('')
        try {
            await api.patch(`/admin/gyms/${gym.id}`, { active: !gym.active })
            reload()
        } catch (err) {
            setActionError(errorMessage(err))
        }
    }

    const gyms = data?.data ?? []

    return (
        <>
            <PageHeader title="Gimnasios" subtitle={`${gyms.length} registrados`} />
            {(error || actionError) && <div className="mb-4"><Alert>{error || actionError}</Alert></div>}

            {loading && !data ? <Loading /> : gyms.length === 0 ? (
                <EmptyState title="Todavia no hay gimnasios registrados" />
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {gyms.map(gym => (
                        <Card key={gym.id}>
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-bold">{gym.name}</h2>
                                    <p className="text-xs text-muted">Desde {formatDate(gym.createdAt)} · {gym.phone ?? 'sin telefono'}</p>
                                </div>
                                <Badge tone={gym.active ? 'ok' : 'bad'}>{gym.active ? 'Activo' : 'Desactivado'}</Badge>
                            </div>
                            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <dt className="text-xs text-muted">Dueño</dt>
                                    <dd>{gym.users[0]?.name ?? '—'}</dd>
                                    <dd className="truncate text-xs text-muted">{gym.users[0]?.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted">Clientes activos</dt>
                                    <dd className="text-xl font-bold tabular-nums">{gym.clientsCount}</dd>
                                </div>
                            </dl>
                            <Button variant={gym.active ? 'danger' : 'secondary'} className="mt-4 px-3 py-1.5 text-xs" onClick={() => toggle(gym)}>
                                {gym.active ? 'Desactivar' : 'Activar'}
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </>
    )
}
