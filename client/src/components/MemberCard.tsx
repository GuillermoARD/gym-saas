import type { Client } from '../api/types'
import { formatDate, fullName } from '../utils/format'
import QrCode from './QrCode'

type MemberCardProps = {
    client: Client
    gymName: string
}

/**
 * Carnet tamaño tarjeta de crédito (85.6 × 54 mm).
 * Al imprimir solo se ve esto (ver .print-area en index.css).
 */
export default function MemberCard({ client, gymName }: MemberCardProps) {
    return (
        <div className="print-area flex justify-center">
            <div
                className="member-card flex overflow-hidden rounded-xl border border-line bg-bg text-ink shadow-xl"
                style={{ width: '85.6mm', height: '54mm' }}
            >
                <div className="flex flex-1 flex-col justify-between p-[4mm]">
                    <div>
                        <p className="text-[7pt] font-bold uppercase tracking-widest text-brand">{gymName}</p>
                        <p className="mt-[1mm] text-[6pt] text-muted">Carnet de miembro</p>
                    </div>
                    <div>
                        <p className="text-[11pt] leading-tight font-extrabold">{fullName(client)}</p>
                        {client.documentId && <p className="mt-[1mm] text-[6.5pt] text-muted">{client.documentId}</p>}
                        <p className="mt-[1mm] text-[6pt] text-muted">Miembro desde {formatDate(client.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center bg-white p-[3mm]">
                    <QrCode value={client.qrCode} size={120} className="h-[38mm] w-[38mm] rounded-none" />
                </div>
            </div>
        </div>
    )
}
