import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Layout'

// Página pública: la ve cualquiera sin cuenta. Explica qué es CyberGym y qué incluye.

const icon = 'h-6 w-6'
const Icons = {
    users: <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    calendar: <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" /></svg>,
    cash: <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></svg>,
    qr: <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" /></svg>,
    card: <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><circle cx="8" cy="11" r="2" /><path d="M5 16c.5-1.5 1.7-2 3-2s2.5.5 3 2M14 10h4M14 14h4" /></svg>,
    chart: <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>,
    shield: <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>,
    cloud: <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.78A6 6 0 0 0 4.5 12.5 3.5 3.5 0 0 0 6 19z" /></svg>,
    check: <svg className="h-5 w-5 shrink-0 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>,
    x: <svg className="h-5 w-5 shrink-0 text-bad" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>,
}

const PROBLEMS = [
    'Membresías vencidas que nadie cobra porque no se dieron cuenta',
    'Pagos anotados en un cuaderno o en un Excel que solo entiende una persona',
    'No saber cuántos clientes activos tienes ni cuánto entró este mes',
    'Gente entrando con la membresía vencida porque en la puerta no hay cómo verificar',
]

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
    { icon: Icons.users, title: 'Clientes', text: 'Ficha de cada cliente con su teléfono, su estado (activo, por vencer o vencido) y su historial de membresías y pagos. Búscalos por nombre o teléfono en segundos.' },
    { icon: Icons.calendar, title: 'Membresías con vencimiento', text: 'Planes mensuales, trimestrales o como los quieras. Si un cliente renueva antes de tiempo, los días que le quedaban no se pierden.' },
    { icon: Icons.cash, title: 'Pagos', text: 'Registra pagos en efectivo, transferencia o tarjeta. Filtra por fecha y método y sabe exactamente cuánto entró.' },
    { icon: Icons.qr, title: 'Check-in con QR', text: 'Cada cliente tiene su código QR. En la entrada se escanea y el sistema dice al instante si su membresía está activa o vencida.' },
    { icon: Icons.card, title: 'Carnet imprimible', text: 'Imprime el carnet del cliente en tamaño tarjeta con su QR. Si lo pierde, se genera uno nuevo y el viejo deja de servir.' },
    { icon: Icons.chart, title: 'Dashboard', text: 'Clientes activos, por vencer y vencidos, ingresos del mes y entradas de hoy, todo en una sola pantalla.' },
    { icon: Icons.shield, title: 'Roles para tu equipo', text: 'El dueño ve todo. Recepción cobra y registra. Los entrenadores solo ven clientes y planes, sin tocar el dinero.' },
    { icon: Icons.cloud, title: 'En la nube', text: 'Funciona desde la computadora de la recepción, una tablet o tu celular. Sin instalar nada y sin perder datos si se daña una PC.' },
]

const SCREENS = [
    { src: '/landing/dashboard.webp', label: 'Dashboard' },
    { src: '/landing/clientes.webp', label: 'Clientes' },
    { src: '/landing/checkin.webp', label: 'Check-in' },
    { src: '/landing/pagos.webp', label: 'Pagos' },
    { src: '/landing/planes.webp', label: 'Planes' },
    { src: '/landing/carnet.webp', label: 'Carnet con QR' },
]

const STEPS = [
    { title: 'Registra tu gimnasio', text: 'Crea tu cuenta de dueño en menos de un minuto.' },
    { title: 'Crea tus planes y tu equipo', text: 'Agrega tus planes con sus precios y dale acceso a tu recepción y entrenadores.' },
    { title: 'Empieza a cobrar y controlar', text: 'Registra tus clientes, vende membresías y controla la entrada con el QR.' },
]

const FAQ = [
    { q: '¿Necesito instalar algo?', a: 'No. Funciona en el navegador de cualquier computadora, tablet o celular. Solo necesitas internet.' },
    { q: '¿Sirve para un gimnasio pequeño?', a: 'Sí, está pensado justo para gimnasios pequeños y medianos de República Dominicana que hoy llevan todo en cuaderno o en Excel.' },
    { q: '¿Qué necesito para el check-in con QR?', a: 'Puedes usar un lector QR USB (funciona como un teclado) o escribir el código. El carnet lo imprimes desde el mismo sistema.' },
    { q: '¿Mis datos están seguros?', a: 'Cada gimnasio solo ve sus propios datos, las contraseñas se guardan cifradas y todo se respalda en la nube.' },
    { q: '¿Puedo cobrar en línea?', a: 'Por ahora registras pagos en efectivo, transferencia o tarjeta en tu POS. Los pagos en línea y los recordatorios por WhatsApp vienen en camino.' },
]

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
    return (
        <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold tracking-widest text-brand uppercase">{eyebrow}</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
            {text && <p className="mt-4 text-lg text-muted text-pretty">{text}</p>}
        </div>
    )
}

export default function Landing() {
    const [screen, setScreen] = useState(0)
    const [openFaq, setOpenFaq] = useState<number | null>(0)

    return (
        <div className="min-h-screen overflow-x-hidden">
            {/* Barra superior */}
            <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/80 backdrop-blur">
                <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
                    <Link to="/" aria-label="CyberGym, inicio"><Logo /></Link>
                    <div className="hidden items-center gap-6 text-sm whitespace-nowrap text-muted lg:flex">
                        <a href="#funciones" className="hover:text-ink">Funciones</a>
                        <a href="#capturas" className="hover:text-ink">El sistema</a>
                        <a href="#como-funciona" className="hover:text-ink">Cómo funciona</a>
                        <a href="#preguntas" className="hover:text-ink">Preguntas</a>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                        <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:text-ink">Iniciar sesión</Link>
                        <Link to="/registro" className="hidden rounded-lg bg-brand px-4 py-2 text-sm font-bold text-bg hover:bg-brand-strong sm:inline-block">Registra tu gimnasio</Link>
                    </div>
                </nav>
            </header>

            <main>
                {/* Hero */}
                <section className="relative">
                    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[480px] max-w-4xl rounded-full bg-brand/15 blur-3xl" />
                    <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-10 text-center sm:pt-24">
                        <p className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                            Hecho para gimnasios de República Dominicana
                        </p>
                        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black tracking-tight text-balance sm:text-6xl">
                            Administra tu gimnasio <span className="text-brand">sin cuaderno ni Excel</span>
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted text-pretty">
                            Clientes, membresías, pagos y control de entrada con QR en un solo lugar.
                            Sabe en todo momento quién está al día, quién debe y cuánto entró este mes.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link to="/registro" className="w-full rounded-lg bg-brand px-6 py-3 font-bold text-bg hover:bg-brand-strong sm:w-auto">Registra tu gimnasio gratis</Link>
                            <a href="#funciones" className="w-full rounded-lg border border-line bg-surface-2 px-6 py-3 font-semibold hover:border-brand/50 sm:w-auto">Ver qué incluye</a>
                        </div>
                        <div className="mx-auto mt-14 max-w-5xl rounded-2xl border border-line bg-surface p-2 shadow-2xl shadow-brand/10">
                            <img src="/landing/dashboard.webp" alt="Dashboard de CyberGym con clientes activos, por vencer e ingresos del mes" width={1440} height={900} className="w-full rounded-xl" />
                        </div>
                    </div>
                </section>

                {/* Problemas */}
                <section className="mx-auto max-w-6xl px-4 py-20">
                    <SectionTitle eyebrow="El problema" title="¿Te suena familiar?" text="Así se administra la mayoría de los gimnasios pequeños, y así se pierde dinero todos los meses." />
                    <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2">
                        {PROBLEMS.map(p => (
                            <div key={p} className="flex gap-3 rounded-xl border border-line bg-surface p-5">
                                {Icons.x}
                                <p className="text-ink/90">{p}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mx-auto mt-10 max-w-2xl text-center text-lg">
                        <span className="font-bold text-brand">CyberGym</span> pone todo eso en orden para que te concentres en tus clientes, no en el papeleo.
                    </p>
                </section>

                {/* Funciones */}
                <section id="funciones" className="scroll-mt-20 border-y border-line bg-surface/40">
                    <div className="mx-auto max-w-6xl px-4 py-20">
                        <SectionTitle eyebrow="Funciones" title="Todo lo que tu gimnasio necesita" text="Sin módulos extra ni cosas que no vas a usar." />
                        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {FEATURES.map(f => (
                                <div key={f.title} className="rounded-xl border border-line bg-surface p-6 transition-colors hover:border-brand/40">
                                    <div className="inline-flex rounded-lg bg-brand/10 p-2.5 text-brand">{f.icon}</div>
                                    <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Capturas */}
                <section id="capturas" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
                    <SectionTitle eyebrow="El sistema" title="Así se ve por dentro" text="Pantallas simples, pensadas para que tu recepción lo aprenda en un día." />
                    <div className="mt-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Pantallas del sistema">
                        {SCREENS.map((s, i) => (
                            <button
                                key={s.label}
                                role="tab"
                                aria-selected={screen === i}
                                onClick={() => setScreen(i)}
                                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors ${screen === i ? 'bg-brand text-bg' : 'border border-line bg-surface text-muted hover:text-ink'}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <div className="mx-auto mt-8 max-w-5xl rounded-2xl border border-line bg-surface p-2">
                        <img key={SCREENS[screen].src} src={SCREENS[screen].src} alt={`Pantalla de ${SCREENS[screen].label}`} width={1440} height={900} loading="lazy" className="w-full rounded-xl" />
                    </div>
                </section>

                {/* Cómo funciona */}
                <section id="como-funciona" className="scroll-mt-20 border-y border-line bg-surface/40">
                    <div className="mx-auto max-w-6xl px-4 py-20">
                        <SectionTitle eyebrow="Cómo funciona" title="Empieza hoy mismo en 3 pasos" />
                        <ol className="mt-12 grid gap-5 md:grid-cols-3">
                            {STEPS.map((s, i) => (
                                <li key={s.title} className="rounded-xl border border-line bg-surface p-6">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-black text-bg">{i + 1}</span>
                                    <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                                    <p className="mt-2 text-muted">{s.text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Precio */}
                <section className="mx-auto max-w-6xl px-4 py-20">
                    <SectionTitle eyebrow="Precio" title="Pruébalo sin pagar nada" />
                    <div className="mx-auto mt-12 max-w-md rounded-2xl border border-brand/40 bg-surface p-8 shadow-xl shadow-brand/10">
                        <p className="text-sm font-bold tracking-widest text-brand uppercase">Programa piloto</p>
                        <p className="mt-3 text-5xl font-black">Gratis</p>
                        <p className="mt-2 text-muted">Mientras dure el piloto, para los primeros gimnasios que se unan.</p>
                        <ul className="mt-6 space-y-3">
                            {['Clientes ilimitados', 'Membresías, pagos y check-in con QR', 'Usuarios para tu recepción y entrenadores', 'Dashboard con tus ingresos', 'Ayuda para configurarlo'].map(item => (
                                <li key={item} className="flex gap-3">{Icons.check}<span>{item}</span></li>
                            ))}
                        </ul>
                        <Link to="/registro" className="mt-8 block rounded-lg bg-brand px-6 py-3 text-center font-bold text-bg hover:bg-brand-strong">Registra tu gimnasio</Link>
                    </div>
                </section>

                {/* Preguntas */}
                <section id="preguntas" className="scroll-mt-20 border-t border-line bg-surface/40">
                    <div className="mx-auto max-w-3xl px-4 py-20">
                        <SectionTitle eyebrow="Preguntas" title="Preguntas frecuentes" />
                        <div className="mt-10 space-y-3">
                            {FAQ.map((f, i) => (
                                <div key={f.q} className="rounded-xl border border-line bg-surface">
                                    <button
                                        className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left font-semibold"
                                        aria-expanded={openFaq === i}
                                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    >
                                        {f.q}
                                        <span className={`text-brand transition-transform ${openFaq === i ? 'rotate-45' : ''}`} aria-hidden>+</span>
                                    </button>
                                    {openFaq === i && <p className="px-5 pb-5 text-muted">{f.a}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Llamado final */}
                <section className="mx-auto max-w-6xl px-4 py-20">
                    <div className="rounded-3xl border border-brand/30 bg-gradient-to-br from-brand/20 to-surface p-10 text-center sm:p-14">
                        <h2 className="text-3xl font-extrabold text-balance sm:text-4xl">Deja el cuaderno. Tu gimnasio merece algo mejor.</h2>
                        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">Regístrate gratis y ten tu gimnasio funcionando hoy mismo.</p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link to="/registro" className="w-full rounded-lg bg-brand px-6 py-3 font-bold text-bg hover:bg-brand-strong sm:w-auto">Registra tu gimnasio</Link>
                            <Link to="/login" className="w-full rounded-lg border border-line bg-surface-2 px-6 py-3 font-semibold hover:border-brand/50 sm:w-auto">Ya tengo cuenta</Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-line">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row">
                    <Logo />
                    <p>© {new Date().getFullYear()} CyberGym · Hecho en República Dominicana</p>
                </div>
            </footer>
        </div>
    )
}
