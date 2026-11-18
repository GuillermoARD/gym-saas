import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, errorMessage } from '../api/client'
import type { CheckIn as CheckInRow, CheckInResult, Client } from '../api/types'
import MembershipBadge from '../components/MembershipBadge'
import { Alert, Badge, Button, Card, EmptyState, Input, PageHeader } from '../components/ui'
import { useApi } from '../hooks/useApi'
import { formatDate, formatTime, fullName } from '../utils/format'

/**
 * Los lectores de QR USB funcionan como un teclado: escriben el código y presionan Enter.
 * Por eso el campo siempre tiene el foco y se limpia después de cada lectura.
 */
export default function CheckIn() {
    const inputRef = useRef<HTMLInputElement>(null)
    const [code, setCode] = useState('')
    const [result, setResult] = useState<CheckInResult | null>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const [search, setSearch] = useState('')
    const [matches, setMatches] = useState<Client[]>([])

    const today = useApi<{ data: CheckInRow[] }>('/checkins')

    useEffect(() => { inputRef.current?.focus() }, [])

    // Búsqueda manual por nombre (para quien olvidó su carnet)
    useEffect(() => {
        if (search.trim().length < 2) { setMatches([]); return }
        const timer = setTimeout(() => {
            api.get<{ data: Client[] }>('/clients', { params: { search } })
                .then(res => setMatches(res.data.data.slice(0, 6)))
                .catch(() => setMatches([]))
        }, 250)
        return () => clearTimeout(timer)
    }, [search])

    const register = async (body: { code: string } | { clientId: number }) => {
        setLoading(true)
        setError('')
        try {
            const res = await api.post<{ data: CheckInResult }>('/checkins', body)
            setResult(res.data.data)
            today.reload()
        } catch (err) {
            setResult(null)
            setError(errorMessage(err))
        } finally {
            setLoading(false)
            setCode('')
            setSearch('')
            inputRef.current?.focus()
        }
    }

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (code.trim()) register({ code: code.trim() })
    }

    const entries = today.data?.data ?? []
    const allowedCount = entries.filter(e => e.allowed).length

    return (
        <>
            <PageHeader title="Check-in" subtitle="Escanea el QR del carnet o busca al cliente por nombre" />

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="flex flex-col gap-6">
                    <Card>
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <Input
                                ref={inputRef}
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="Escanea o pega el codigo del QR"
                                aria-label="Codigo QR"
                                autoComplete="off"
                                className="text-base"
                            />
                            <Button type="submit" loading={loading}>Registrar</Button>
                        </form>

                        <div className="relative mt-4">
                            <Input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="...o busca por nombre, telefono o cedula"
                                aria-label="Buscar cliente"
                            />
                            {matches.length > 0 && (
                                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-line bg-surface-2 shadow-xl">
                                    {matches.map(c => (
                                        <li key={c.id}>
                                            <button
                                                onClick={() => register({ clientId: c.id })}
                                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-surface cursor-pointer"
                                            >
                                                <span>{fullName(c)} <span className="text-muted">{c.documentId ?? c.phone ?? ''}</span></span>
                                                <MembershipBadge membership={c.membership} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </Card>

                    {error && <Alert>{error}</Alert>}

                    {result && (
                        <div
                            role="status"
                            className={`rounded-2xl border-2 p-8 text-center ${result.allowed ? 'border-ok bg-ok/10' : 'border-bad bg-bad/10'}`}
                        >
                            <p className={`text-5xl font-black ${result.allowed ? 'text-ok' : 'text-bad'}`}>
                                {result.allowed ? 'ADELANTE' : 'NO PERMITIDO'}
                            </p>
                            <Link to={`/clientes/${result.client.id}`} className="mt-4 block text-2xl font-bold hover:text-brand">
                                {fullName(result.client)}
                            </Link>
                            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                                <MembershipBadge membership={result.client.membership} />
                                {result.client.membership.expiresOn && (
                                    <span className="text-sm text-muted">Vence: {formatDate(result.client.membership.expiresOn)}</span>
                                )}
                            </div>
                            {result.reason && <p className="mt-3 font-semibold text-bad">{result.reason}</p>}
                            {result.allowed && result.alreadyCheckedInToday && (
                                <p className="mt-3 text-sm text-warn">Ya habia entrado hoy</p>
                            )}
                        </div>
                    )}
                </div>

                <Card>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-bold">Entradas de hoy</h2>
                        <Badge tone="brand">{allowedCount}</Badge>
                    </div>
                    {entries.length ? (
                        <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto text-sm">
                            {entries.map(entry => (
                                <li key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                                    <span className="truncate">{entry.client ? fullName(entry.client) : '—'}</span>
                                    <span className="flex shrink-0 items-center gap-2">
                                        {!entry.allowed && <Badge tone="bad">Rechazado</Badge>}
                                        <span className="text-muted tabular-nums">{formatTime(entry.createdAt)}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <EmptyState title="Nadie ha entrado todavia" />
                    )}
                </Card>
            </div>
        </>
    )
}
