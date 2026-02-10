import Link from 'next/link'
import { prisma } from '@/lib/db'
import AssetList from '@/components/AssetList'

export const revalidate = 10 // Cache for 10 seconds

export default async function AssetsPage() {
    // Fetch data
    const assets = await prisma.asset.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            AssetModel: {
                include: { Manufacturer: true }
            }
        }
    })

    // Calculate stats
    const total = assets.length
    const assigned = assets.filter(a => a.Status === 'Assigned').length
    const available = assets.filter(a => a.Status === 'Available').length

    return (
        <div className="container">
            <div className="header">
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Assets</h1>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                        <span><strong>{total}</strong> Total</span>
                        <span style={{ color: '#059669' }}><strong>{available}</strong> Available</span>
                        <span style={{ color: '#2563eb' }}><strong>{assigned}</strong> Assigned</span>
                    </div>
                </div>
                <Link href="/assets/new" className="btn btn-primary">
                    + Add Asset
                </Link>
            </div>

            <AssetList initialAssets={assets} />
        </div>
    )
}
