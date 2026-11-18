import type { Membership } from '../models'
import { diffDays, today } from '../utils/dates'

export const EXPIRING_SOON_DAYS = 7

export type MembershipState = 'active' | 'expiring' | 'upcoming' | 'expired' | 'none'

export type MembershipSummary = {
    state: MembershipState
    currentMembershipId: number | null
    expiresOn: string | null
    daysLeft: number | null
}

/**
 * Resume el estado de un cliente a partir de sus membresías.
 * Las renovaciones se encadenan, así que "vence" es el fin de la última membresía vigente.
 */
export function summarizeMemberships(memberships: Membership[], ref = today()): MembershipSummary {
    const valid = memberships.filter(m => m.status === 'active')
    if (!valid.length) {
        return { state: 'none', currentMembershipId: null, expiresOn: null, daysLeft: null }
    }

    const latestEnd = valid.reduce((max, m) => (m.endDate > max ? m.endDate : max), valid[0].endDate)
    const current = valid.find(m => m.startDate <= ref && m.endDate >= ref)
    const daysLeft = diffDays(ref, latestEnd)

    if (current) {
        return {
            state: daysLeft <= EXPIRING_SOON_DAYS ? 'expiring' : 'active',
            currentMembershipId: current.id,
            expiresOn: latestEnd,
            daysLeft,
        }
    }

    if (latestEnd >= ref) {
        // tiene una membresía pagada que empieza más adelante
        return { state: 'upcoming', currentMembershipId: null, expiresOn: latestEnd, daysLeft }
    }

    return { state: 'expired', currentMembershipId: null, expiresOn: latestEnd, daysLeft }
}

export function hasAccess(summary: MembershipSummary) {
    return summary.state === 'active' || summary.state === 'expiring'
}
