import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AssignmentForm from '@/components/AssignmentForm'

export default async function AssignAssetPage({ params }: { params: { id: string } }) {
    const asset = await prisma.asset.findUnique({
        where: { AssetID: params.id }
    })

    if (!asset) notFound()
    if (asset.Status !== 'Available') {
        return (
            <div className="container">
                <h1>Asset Unavailable</h1>
                <p>This asset is currently {asset.Status} and cannot be assigned.</p>
                <Link href={`/assets/${params.id}`} className="btn btn-primary">Back to Asset</Link>
            </div>
        )
    }

    const employees = await prisma.employee.findMany({
        orderBy: { LastName: 'asc' }
    })

    return (
        <div className="container">
            <div className="header">
                <h1>Assign Asset</h1>
            </div>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ marginTop: 0 }}>Selected Asset</h3>
                    <p><strong>{asset.AssetName}</strong> ({asset.AssetType})</p>
                    <p style={{ color: '#666' }}>SN: {asset.SerialNumber}</p>
                </div>

                <AssignmentForm asset={asset} employees={employees} />
            </div>
        </div>
    )
}
