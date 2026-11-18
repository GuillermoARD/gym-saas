// República Dominicana es UTC-4 todo el año (no hay horario de verano)
const TIME_ZONE = 'America/Santo_Domingo'
const UTC_OFFSET = '-04:00'

/** Fecha de hoy en RD como 'YYYY-MM-DD' */
export function today(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date())
}

export function addDays(date: string, days: number): string {
    const d = new Date(`${date}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + days)
    return d.toISOString().slice(0, 10)
}

/** Días desde `from` hasta `to` (negativo si `to` ya pasó) */
export function diffDays(from: string, to: string): number {
    const ms = new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()
    return Math.round(ms / 86_400_000)
}

export function startOfMonth(date: string): string {
    return `${date.slice(0, 8)}01`
}

/** Instante en que empieza el día `date` en hora de RD */
export function startOfDay(date: string): Date {
    return new Date(`${date}T00:00:00${UTC_OFFSET}`)
}
