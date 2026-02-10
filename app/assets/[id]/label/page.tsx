
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import LabelPrinter from '@/components/inventory/LabelPrinter'

export default async function AssetLabelPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const asset = await prisma.asset.findUnique({
        where: { AssetID: id },
        include: { AssetModel: { include: { Manufacturer: true } } }
    })

    if (!asset) notFound()

    // Generate QR URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const qrData = `${baseUrl}/assets/${id}`
    // Using a reliable public API for QR generation
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`

    return <LabelPrinter asset={asset} qrUrl={qrUrl} />
}
