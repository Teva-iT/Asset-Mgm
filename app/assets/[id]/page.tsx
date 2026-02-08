import { prisma } from '@/lib/db'
import AssetForm from '@/components/AssetForm'
import { notFound } from 'next/navigation'

import Link from 'next/link'

export default async function EditAssetPage({ params }: { params: { id: string } }) {
    const asset = await prisma.asset.findUnique({
        where: { AssetID: params.id },
    })

    if (!asset) {
        notFound()
    }

    // Serialize Date objects to strings for the Client Component
    const serializedAsset = {
        ...asset,
        PurchaseDate: asset.PurchaseDate.toISOString(),
    }

    return (
        <div className="container">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ margin: 0 }}>Edit Asset</h1>
                </div>
                <Link href="/assets" className="btn btn-outline" style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                    Back
                </Link>
            </div>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <AssetForm asset={serializedAsset} />
            </div>
        </div>
    )
}
