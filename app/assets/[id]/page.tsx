import { prisma } from '@/lib/db'
import AssetForm from '@/components/AssetForm'
import { notFound } from 'next/navigation'

import Link from 'next/link'

export default async function EditAssetPage({ params }: { params: { id: string } }) {
    const asset = await prisma.asset.findUnique({
        where: { AssetID: params.id },
        include: {
            assignments: {
                where: { Status: 'Active' },
                include: {
                    Employee: true,
                    AssignedBy: true
                }
            },
            Photos: true
        }
    })

    if (!asset) {
        notFound()
    }

    // Serialize Date objects to strings for the Client Component
    const serializedAsset = {
        ...asset,
        PurchaseDate: asset.PurchaseDate.toISOString(),
    }

    // Fetch admins for the assignment dropdown
    const admins = await prisma.user.findMany({
        where: { Role: 'ADMIN' },
        select: { UserID: true, Username: true }
    })

    const formattedAdmins = admins.map(a => ({ id: a.UserID, name: a.Username }))

    // Mock current user for now (In a real app, this should come from session/token)
    // Since we are in a server component and getting cookie is async/complex here without helpers,
    // we will pass a placeholder or try to extract from cookie if possible, 
    // but for now let's just pass the admin list so the dropdown works.
    // The AssetForm relies on `currentUser` for default "Assigned By" selection, 
    // but in Edit mode, we will use the existing assignment's 'AssignedBy'.

    return (
        <div className="container">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ margin: 0 }}>Edit Asset</h1>
                    {asset.Condition && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {asset.Condition}
                        </span>
                    )}
                </div>
                <Link href="/assets" className="btn btn-outline" style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                    Back
                </Link>
            </div>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <AssetForm
                    asset={serializedAsset}
                    admins={formattedAdmins}
                // We can't easily get current user here without duplicating logic, 
                // but for Edit mode it's less critical if we rely on existing data.
                />
            </div>
        </div>
    )
}
