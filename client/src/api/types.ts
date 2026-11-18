export type Role = 'super_admin' | 'owner' | 'reception' | 'trainer' | 'maintenance'
export type PaymentMethod = 'cash' | 'transfer' | 'card'
export type MembershipState = 'active' | 'expiring' | 'upcoming' | 'expired' | 'none'

export type Gym = {
    id: number
    name: string
    slug: string
    phone: string | null
    address: string | null
    active: boolean
    createdAt: string
}

export type User = {
    id: number
    gymId: number | null
    name: string
    email: string | null
    role: Role
    active: boolean
    gym?: Gym | null
}

export type Plan = {
    id: number
    name: string
    description: string | null
    price: number
    durationDays: number
    active: boolean
}

export type MembershipSummary = {
    state: MembershipState
    currentMembershipId: number | null
    expiresOn: string | null
    daysLeft: number | null
}

export type Client = {
    id: number
    firstName: string
    lastName: string
    phone: string | null
    email: string | null
    documentId: string | null
    birthDate: string | null
    notes: string | null
    qrCode: string
    active: boolean
    createdAt: string
    membership: MembershipSummary
}

export type Membership = {
    id: number
    planId: number
    startDate: string
    endDate: string
    price: number
    status: 'active' | 'cancelled'
    plan?: Pick<Plan, 'id' | 'name' | 'durationDays'>
}

export type Payment = {
    id: number
    clientId: number
    membershipId: number | null
    amount: number
    method: PaymentMethod
    reference: string | null
    notes: string | null
    paidAt: string
    client?: Pick<Client, 'id' | 'firstName' | 'lastName'>
    receivedBy?: Pick<User, 'id' | 'name'> | null
}

export type CheckIn = {
    id: number
    clientId: number
    allowed: boolean
    reason: string | null
    createdAt: string
    client?: Pick<Client, 'id' | 'firstName' | 'lastName'>
}

export type ClientDetail = Client & {
    memberships: Membership[]
    payments: Payment[]
    checkIns: CheckIn[]
}

export type CheckInResult = {
    checkIn: CheckIn
    allowed: boolean
    reason: string | null
    alreadyCheckedInToday: boolean
    client: Pick<Client, 'id' | 'firstName' | 'lastName'> & { membership: MembershipSummary }
}

export type Dashboard = {
    date: string
    members: { total: number; active: number; expiring: number; expired: number; none: number }
    checkIns: { today: number }
    expiringSoon: (Pick<Client, 'id' | 'firstName' | 'lastName' | 'phone'> & { expiresOn: string; daysLeft: number })[]
    revenue: {
        today: number
        month: number
        byMethod: Record<PaymentMethod, number>
        recent: Payment[]
    } | null
}

export type PaymentsResponse = {
    data: Payment[]
    summary: { from: string; to: string; total: number; count: number; byMethod: Record<PaymentMethod, number> }
}

export type AdminGym = Gym & { clientsCount: number; users: Pick<User, 'id' | 'name' | 'email'>[] }
