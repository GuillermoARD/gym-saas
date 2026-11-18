import { useEffect, type ButtonHTMLAttributes, type ComponentProps, type PropsWithChildren, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ')

// ---------- Botón ----------
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    loading?: boolean
}

const buttonVariants = {
    primary: 'bg-brand text-bg hover:bg-brand-strong font-bold',
    secondary: 'bg-surface-2 text-ink border border-line hover:border-brand/50',
    ghost: 'text-muted hover:text-ink hover:bg-surface-2',
    danger: 'bg-bad/10 text-bad border border-bad/30 hover:bg-bad/20',
}

export function Button({ variant = 'primary', loading, className, children, disabled, ...props }: ButtonProps) {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={cx(
                'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors cursor-pointer',
                'disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand',
                buttonVariants[variant],
                className,
            )}
        >
            {loading && <Spinner className="h-4 w-4" />}
            {children}
        </button>
    )
}

// ---------- Campos de formulario ----------
type FieldProps = { label: string; error?: string; hint?: string; children: ReactNode; htmlFor?: string }

export function Field({ label, error, hint, children, htmlFor }: FieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium text-muted">{label}</label>
            {children}
            {error ? <p className="text-xs text-bad">{error}</p> : hint && <p className="text-xs text-muted">{hint}</p>}
        </div>
    )
}

const inputClass = 'w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

export function Input({ className, ...props }: ComponentProps<"input">) {
    return <input {...props} className={cx(inputClass, className)} />
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
    return <select {...props} className={cx(inputClass, className)}>{children}</select>
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
    return <textarea {...props} className={cx(inputClass, 'min-h-20', className)} />
}

// ---------- Contenedores ----------
export function Card({ className, children }: PropsWithChildren<{ className?: string }>) {
    return <div className={cx('rounded-xl border border-line bg-surface p-5', className)}>{children}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    )
}

// ---------- Estados ----------
export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
    return <span className={cx('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', className)} aria-label="Cargando" />
}

export function Loading() {
    return <div className="flex justify-center py-16 text-brand"><Spinner /></div>
}

export function Alert({ children, tone = 'bad' }: PropsWithChildren<{ tone?: 'bad' | 'ok' | 'warn' }>) {
    const tones = { bad: 'border-bad/30 bg-bad/10 text-bad', ok: 'border-ok/30 bg-ok/10 text-ok', warn: 'border-warn/30 bg-warn/10 text-warn' }
    return <div role="alert" className={cx('rounded-lg border px-4 py-3 text-sm', tones[tone])}>{children}</div>
}

export function EmptyState({ title, children }: PropsWithChildren<{ title: string }>) {
    return (
        <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
            <p className="font-semibold">{title}</p>
            {children && <div className="mt-2 text-sm text-muted">{children}</div>}
        </div>
    )
}

export function Badge({ tone = 'muted', children }: PropsWithChildren<{ tone?: 'ok' | 'warn' | 'bad' | 'brand' | 'muted' }>) {
    const tones = {
        ok: 'bg-ok/15 text-ok',
        warn: 'bg-warn/15 text-warn',
        bad: 'bg-bad/15 text-bad',
        brand: 'bg-brand/15 text-brand',
        muted: 'bg-surface-2 text-muted',
    }
    return <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', tones[tone])}>{children}</span>
}

// ---------- Modal ----------
export function Modal({ open, onClose, title, children }: PropsWithChildren<{ open: boolean; onClose: () => void; title: string }>) {
    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [open, onClose])

    if (!open) return null

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center" onMouseDown={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onMouseDown={e => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl"
            >
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button onClick={onClose} aria-label="Cerrar" className="rounded-lg p-1 text-2xl leading-none text-muted hover:text-ink cursor-pointer">×</button>
                </div>
                {children}
            </div>
        </div>,
        document.body,
    )
}
