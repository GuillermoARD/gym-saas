import { useCallback, useEffect, useState } from 'react'
import { api, errorMessage } from '../api/client'

/** GET simple con estado de carga/error y función para recargar */
export function useApi<T>(url: string | null) {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [version, setVersion] = useState(0)

    useEffect(() => {
        if (!url) return
        let cancelled = false
        setLoading(true)
        api.get<T>(url)
            .then(res => {
                if (!cancelled) { setData(res.data); setError('') }
            })
            .catch(err => {
                if (!cancelled) setError(errorMessage(err))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => { cancelled = true }
    }, [url, version])

    const reload = useCallback(() => setVersion(v => v + 1), [])

    return { data, loading, error, reload }
}
