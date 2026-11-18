import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import type { Role } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS } from '../utils/format'

type NavItem = { to: string; label: string; icon: string; roles: Role[] }

// Íconos como paths SVG para no depender de una librería
const NAV: NavItem[] = [
    { to: '/', label: 'Inicio', icon: 'M3 12l9-8 9 8M5 10v10h14V10', roles: ['owner', 'reception', 'trainer'] },
    { to: '/checkin', label: 'Check-in', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2', roles: ['owner', 'reception'] },
    { to: '/clientes', label: 'Clientes', icon: 'M16 19v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1M9 10a3 3 0 100-6 3 3 0 000 6zM22 19v-1a4 4 0 00-3-3.87M16 4.13a3 3 0 010 5.74', roles: ['owner', 'reception', 'trainer'] },
    { to: '/pagos', label: 'Pagos', icon: 'M2 7h20v12H2zM2 11h20M6 15h4', roles: ['owner', 'reception'] },
    { to: '/planes', label: 'Planes', icon: 'M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01', roles: ['owner', 'reception', 'trainer'] },
    { to: '/personal', label: 'Personal', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21v-1a6 6 0 0112 0v1M19 8v6M22 11h-6', roles: ['owner'] },
    { to: '/admin', label: 'Gimnasios', icon: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6', roles: ['super_admin'] },
]

function Icon({ d }: { d: string }) {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={d} />
        </svg>
    )
}

export function Logo() {
    return (
        <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <span className="text-lg font-extrabold tracking-tight">Cyber<span className="text-brand">Gym</span></span>
        </div>
    )
}

export default function Layout() {
    const { user, logout } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)
    if (!user) return null

    const items = NAV.filter(item => item.roles.includes(user.role))

    const nav = (
        <nav className="flex flex-col gap-1">
            {items.map(item => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-2 hover:text-ink'
                    }`}
                >
                    <Icon d={item.icon} />
                    {item.label}
                </NavLink>
            ))}
        </nav>
    )

    const account = (
        <div className="border-t border-line pt-4">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{ROLE_LABELS[user.role]}{user.gym ? ` · ${user.gym.name}` : ''}</p>
            <button onClick={logout} className="mt-3 text-sm font-medium text-muted hover:text-bad cursor-pointer">Cerrar sesion</button>
        </div>
    )

    return (
        <div className="min-h-screen lg:flex">
            {/* Barra lateral (escritorio) */}
            <aside className="hidden w-60 shrink-0 flex-col justify-between border-r border-line bg-surface p-4 lg:flex lg:sticky lg:top-0 lg:h-screen">
                <div className="flex flex-col gap-8">
                    <Logo />
                    {nav}
                </div>
                {account}
            </aside>

            {/* Barra superior (móvil) */}
            <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
                <Logo />
                <button
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label="Menu"
                    aria-expanded={menuOpen}
                    className="rounded-lg p-2 text-muted hover:text-ink cursor-pointer"
                >
                    <Icon d={menuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 6h16M4 12h16M4 18h16'} />
                </button>
            </header>
            {menuOpen && (
                <div className="fixed inset-x-0 top-[57px] z-30 flex flex-col gap-6 border-b border-line bg-surface p-4 lg:hidden">
                    {nav}
                    {account}
                </div>
            )}

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-10">
                <Outlet />
            </main>
        </div>
    )
}
