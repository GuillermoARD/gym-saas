import type { MembershipState, PaymentMethod, Role } from '../api/types'

const money = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' })

export function formatMoney(amount: number) {
    return money.format(amount)
}

/** 'YYYY-MM-DD' -> '15 jun 2026' (sin corrimiento por zona horaria) */
export function formatDate(date: string | null | undefined) {
    if (!date) return '—'
    return new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString('es-DO', {
        day: 'numeric', month: 'short', year: 'numeric',
    })
}

export function formatDateTime(date: string) {
    return new Date(date).toLocaleString('es-DO', {
        day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
    })
}

export function formatTime(date: string) {
    return new Date(date).toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit' })
}

export function todayISO() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo' }).format(new Date())
}

export const ROLE_LABELS: Record<Role, string> = {
    super_admin: 'Super admin',
    owner: 'Dueño',
    reception: 'Recepcion',
    trainer: 'Entrenador',
    maintenance: 'Mantenimiento',
}

export const METHOD_LABELS: Record<PaymentMethod, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    card: 'Tarjeta',
}

export const STATE_LABELS: Record<MembershipState, string> = {
    active: 'Activa',
    expiring: 'Por vencer',
    upcoming: 'Pendiente',
    expired: 'Vencida',
    none: 'Sin membresia',
}

export function fullName(c: { firstName: string; lastName: string }) {
    return `${c.firstName} ${c.lastName}`
}
