import { useState, type FormEvent } from 'react'
import { api, errorMessage, fieldErrors } from '../api/client'
import type { Role, User } from '../api/types'
import { Alert, Badge, Button, Card, Field, Input, Loading, Modal, PageHeader, Select } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { ROLE_LABELS } from '../utils/format'

const STAFF_ROLES: { value: Exclude<Role, 'super_admin'>; help: string }[] = [
    { value: 'reception', help: 'Registra clientes, cobra y hace check-in' },
    { value: 'trainer', help: 'Solo consulta clientes y planes' },
    { value: 'owner', help: 'Acceso total, incluido personal y planes' },
    { value: 'maintenance', help: 'Limpieza / mantenimiento, sin acceso al sistema' },
]

function StaffForm({ member, onSaved, onCancel }: { member?: User; onSaved: () => void; onCancel: () => void }) {
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [role, setRole] = useState<Role>(member?.role ?? 'reception')
    const hasAccess = role !== 'maintenance'
    // al editar, el email solo se pide si el usuario todavía no tiene uno
    const askEmail = hasAccess && !member?.email
    // quien pasa de mantenimiento a un rol con acceso necesita contraseña nueva
    const needsPassword = !member || member.role === 'maintenance'

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
        setLoading(true)
        setErrors({})
        setError('')
        try {
            if (member) {
                await api.patch(`/staff/${member.id}`, {
                    name: form.name,
                    role: form.role,
                    ...(form.email ? { email: form.email } : {}),
                    ...(form.password ? { password: form.password } : {}),
                })
            } else {
                await api.post('/staff', form)
            }
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
                <Input id="name" name="name" defaultValue={member?.name} required autoFocus />
            </Field>
            <Field label="Rol" htmlFor="role" error={errors.role}>
                <Select id="role" name="role" value={role} onChange={e => setRole(e.target.value as Role)}>
                    {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{ROLE_LABELS[r.value]} — {r.help}</option>)}
                </Select>
            </Field>
            {askEmail && (
                <Field label="Email (con este entra al sistema)" htmlFor="email" error={errors.email}>
                    <Input id="email" name="email" type="email" required />
                </Field>
            )}
            {hasAccess ? (
                <Field
                    label={needsPassword ? 'Contraseña' : 'Nueva contraseña (opcional)'}
                    htmlFor="password"
                    error={errors.password}
                    hint={needsPassword ? 'Minimo 8 caracteres. Compartela con el empleado.' : 'Dejala vacia para no cambiarla'}
                >
                    <Input id="password" name="password" type="password" minLength={8} required={needsPassword} autoComplete="new-password" />
                </Field>
            ) : (
                <p className="text-sm text-muted">Este empleado aparece en tu lista de personal pero no puede entrar al sistema.</p>
            )}
            <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" loading={loading}>{member ? 'Guardar' : 'Crear usuario'}</Button>
            </div>
        </form>
    )
}

export default function Staff() {
    const { user } = useAuth()
    const { data, loading, error, reload } = useApi<{ data: User[] }>('/staff')
    const [editing, setEditing] = useState<User | 'new' | null>(null)
    const [actionError, setActionError] = useState('')

    const toggleActive = async (member: User) => {
        setActionError('')
        try {
            await api.patch(`/staff/${member.id}`, { active: !member.active })
            reload()
        } catch (err) {
            setActionError(errorMessage(err))
        }
    }

    return (
        <>
            <PageHeader
                title="Personal"
                subtitle="Usuarios de tu gimnasio y lo que puede hacer cada uno"
                actions={<Button onClick={() => setEditing('new')}>+ Nuevo usuario</Button>}
            />

            {(error || actionError) && <div className="mb-4"><Alert>{error || actionError}</Alert></div>}

            {loading && !data ? <Loading /> : (
                <Card className="p-0">
                    <ul className="divide-y divide-line">
                        {data?.data.map(member => (
                            <li key={member.id} className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${member.active ? '' : 'opacity-60'}`}>
                                <div className="min-w-0">
                                    <p className="font-medium">
                                        {member.name} {member.id === user?.id && <span className="text-xs text-muted">(tu)</span>}
                                    </p>
                                    <p className="truncate text-sm text-muted">{member.role === 'maintenance' ? 'Sin acceso al sistema' : member.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge tone={member.role === 'owner' ? 'brand' : 'muted'}>{ROLE_LABELS[member.role]}</Badge>
                                    {!member.active && <Badge tone="bad">Desactivado</Badge>}
                                    <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setEditing(member)}>Editar</Button>
                                    {member.id !== user?.id && (
                                        <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => toggleActive(member)}>
                                            {member.active ? 'Desactivar' : 'Activar'}
                                        </Button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo usuario' : 'Editar usuario'}>
                {editing !== null && (
                    <StaffForm
                        member={editing === 'new' ? undefined : editing}
                        onCancel={() => setEditing(null)}
                        onSaved={() => { setEditing(null); reload() }}
                    />
                )}
            </Modal>
        </>
    )
}
