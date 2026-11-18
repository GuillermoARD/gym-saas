import axios, { AxiosError } from 'axios'

export const TOKEN_KEY = 'gym_token'

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
})

api.interceptors.request.use(config => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Si la sesión expira, se avisa a la app para que mande al login
api.interceptors.response.use(undefined, (error: AxiosError) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
        localStorage.removeItem(TOKEN_KEY)
        window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error)
})

type ApiErrorBody = { error?: string; errors?: { field: string; message: string }[] }

/** Mensaje legible a partir de un error del API */
export function errorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        const body = error.response?.data as ApiErrorBody | undefined
        if (body?.errors?.length) return body.errors.map(e => e.message).join('. ')
        if (body?.error) return body.error
        if (!error.response) return 'No se pudo conectar con el servidor'
    }
    return 'Ocurrio un error inesperado'
}

/** Errores de validación por campo, para mostrarlos debajo de cada input */
export function fieldErrors(error: unknown): Record<string, string> {
    if (!(error instanceof AxiosError)) return {}
    const body = error.response?.data as ApiErrorBody | undefined
    return Object.fromEntries((body?.errors ?? []).map(e => [e.field, e.message]))
}
