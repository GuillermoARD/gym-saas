import { createBrowserRouter, Link } from 'react-router-dom'
import Layout from './components/Layout'
import RequireAuth from './components/RequireAuth'
import AdminGyms from './pages/AdminGyms'
import CheckIn from './pages/CheckIn'
import ClientDetail from './pages/ClientDetail'
import Clients from './pages/Clients'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Payments from './pages/Payments'
import Plans from './pages/Plans'
import Register from './pages/Register'
import Staff from './pages/Staff'

function NotFound() {
    return (
        <div className="py-20 text-center">
            <p className="text-5xl font-black text-brand">404</p>
            <p className="mt-2 text-muted">Esta pagina no existe</p>
            <Link to="/" className="mt-6 inline-block font-semibold text-brand hover:underline">Volver al inicio</Link>
        </div>
    )
}

export const router = createBrowserRouter([
    { path: '/login', element: <Login /> },
    { path: '/registro', element: <Register /> },
    {
        element: <RequireAuth roles={['owner', 'reception', 'trainer']} />,
        children: [{
            element: <Layout />,
            children: [
                { index: true, element: <Dashboard /> },
                { path: 'clientes', element: <Clients /> },
                { path: 'clientes/:id', element: <ClientDetail /> },
                { path: 'planes', element: <Plans /> },
                {
                    element: <RequireAuth roles={['owner', 'reception']} />,
                    children: [
                        { path: 'checkin', element: <CheckIn /> },
                        { path: 'pagos', element: <Payments /> },
                    ],
                },
                {
                    element: <RequireAuth roles={['owner']} />,
                    children: [{ path: 'personal', element: <Staff /> }],
                },
            ],
        }],
    },
    {
        element: <RequireAuth roles={['super_admin']} />,
        children: [{
            element: <Layout />,
            children: [{ path: 'admin', element: <AdminGyms /> }],
        }],
    },
    { path: '*', element: <NotFound /> },
])
