import type { MembershipSummary } from '../api/types'
import { STATE_LABELS } from '../utils/format'
import { Badge } from './ui'

const TONES = {
    active: 'ok',
    expiring: 'warn',
    upcoming: 'brand',
    expired: 'bad',
    none: 'muted',
} as const

export default function MembershipBadge({ membership }: { membership: MembershipSummary }) {
    const { state, daysLeft } = membership
    const detail = state === 'expiring' && daysLeft !== null
        ? daysLeft === 0 ? ' · vence hoy' : ` · ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`
        : ''

    return <Badge tone={TONES[state]}>{STATE_LABELS[state]}{detail}</Badge>
}
