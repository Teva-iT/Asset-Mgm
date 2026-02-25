import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import WarrantyTable from '@/components/WarrantyTable'

export const dynamic = 'force-dynamic'

function ws(date: string | null) {
    if (!date) return 'none'
    const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
    if (d < 0) return 'expired'
    if (d <= 30) return 'critical'
    if (d <= 90) return 'warning'
    return 'good'
}

export default async function WarrantiesPage() {
    const { data: assets } = await supabase
        .from('Asset')
        .select('AssetID, AssetName, AssetType, SerialNumber, DeviceTag, Brand, Model, VendorName, VendorContact, PurchasePrice, WarrantyExpiryDate, SupportContractEnd, Status, AssetModel:ModelID(Name, Manufacturer:ManufacturerID(Name))')
        .order('WarrantyExpiryDate', { ascending: true, nullsFirst: false })

    const all = assets || []
    const expired = all.filter(a => ws(a.WarrantyExpiryDate) === 'expired').length
    const critical = all.filter(a => ws(a.WarrantyExpiryDate) === 'critical').length
    const warning = all.filter(a => ws(a.WarrantyExpiryDate) === 'warning').length
    const noData = all.filter(a => !a.WarrantyExpiryDate).length
    const totalValue = all.reduce((sum, a) => sum + (Number((a as any).PurchasePrice) || 0), 0)

    return (
        <div className="container">
            <div className="header">
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🛡️ Warranty Tracking</h1>
                    <p className="text-sm text-gray-500 mt-1">{all.length} assets tracked</p>
                </div>
                <Link href="/assets" className="btn btn-outline">← Assets</Link>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="card p-4 border-l-4 border-red-500 bg-red-50">
                    <div className="text-2xl font-bold text-red-700">{expired}</div>
                    <div className="text-sm text-red-600">Expired</div>
                </div>
                <div className="card p-4 border-l-4 border-orange-500 bg-orange-50">
                    <div className="text-2xl font-bold text-orange-700">{critical}</div>
                    <div className="text-sm text-orange-600">Expiring &lt;30d</div>
                </div>
                <div className="card p-4 border-l-4 border-yellow-500 bg-yellow-50">
                    <div className="text-2xl font-bold text-yellow-700">{warning}</div>
                    <div className="text-sm text-yellow-600">Expiring &lt;90d</div>
                </div>
                <div className="card p-4 border-l-4 border-gray-300 bg-gray-50">
                    <div className="text-2xl font-bold text-gray-600">{noData}</div>
                    <div className="text-sm text-gray-500">No Warranty Data</div>
                </div>
                <div className="card p-4 border-l-4 border-blue-500 bg-blue-50">
                    <div className="text-2xl font-bold text-blue-700">
                        CHF {totalValue.toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-blue-600">Total Asset Value</div>
                </div>
            </div>

            {/* Client table with live search + filter */}
            <WarrantyTable assets={all} />
        </div>
    )
}
