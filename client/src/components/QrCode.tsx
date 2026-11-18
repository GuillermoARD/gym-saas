import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

type QrCodeProps = {
    value: string
    size?: number
    className?: string
}

/** QR en negro sobre blanco: es lo que mejor leen los escáneres, también impreso */
export default function QrCode({ value, size = 220, className }: QrCodeProps) {
    const [src, setSrc] = useState('')

    useEffect(() => {
        let cancelled = false
        QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: 'M' })
            .then(url => { if (!cancelled) setSrc(url) })
            .catch(() => { if (!cancelled) setSrc('') })
        return () => { cancelled = true }
    }, [value, size])

    if (!src) return <div style={{ width: size, height: size }} className={`rounded-lg bg-white/10 ${className ?? ''}`} />

    return <img src={src} width={size} height={size} alt="Codigo QR del cliente" className={`rounded-lg bg-white ${className ?? ''}`} />
}
