import { prisma } from '@/lib/db'
import AssetForm from '@/components/AssetForm'
import { notFound } from 'next/navigation'
import AuditLogViewer from '@/components/AuditLogViewer'
import Link from 'next/link'

export default async function EditAssetPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
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

    // Fetch Audit Logs
    const logs = await prisma.auditLog.findMany({
        where: { AssetID: params.id },
        orderBy: { Timestamp: 'desc' },
        include: { User: { select: { Username: true, Email: true } } }
    })

    // Serialize Date objects to strings for the Client Component
    const serializedAsset = {
        ...asset,
        PurchaseDate: asset.PurchaseDate ? asset.PurchaseDate.toISOString() : undefined,
    }

    // Map logs to format expected by Viewer
    const serializedLogs = logs.map(log => ({
        ...log,
        Timestamp: log.Timestamp.toISOString(),
        User: log.User ? { name: log.User.Username, email: log.User.Email } : null
    }))

    // Fetch admins for the assignment dropdown
    const admins = await prisma.user.findMany({
        where: { Role: 'ADMIN' },
        select: { UserID: true, Username: true }
    })

    const formattedAdmins = admins.map(a => ({ id: a.UserID, name: a.Username }))

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ margin: 0 }} className="text-3xl font-bold text-gray-900">Edit Asset</h1>
                    {asset.Condition && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {asset.Condition}
                        </span>
                    )}
                </div>
                <div className="flex gap-3">
                    <Link href={`/assets/${params.id}/label`} target="_blank" className="btn btn-outline bg-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        Print Label
                    </Link>
                    <Link href="/assets" className="btn btn-outline bg-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                        Back
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <AssetForm
                            asset={serializedAsset}
                            admins={formattedAdmins}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6 sticky top-6">
                        <AuditLogViewer logs={serializedLogs} />
                    </div>
                </div>
            </div>
        </div>
    )
}
