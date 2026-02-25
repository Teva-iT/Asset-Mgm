import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AssetList from '@/components/AssetList'

export const dynamic = 'force-dynamic'

export default async function AssetsPage() {
    // Fetch assets with model/manufacturer
    const { data: assetsRaw } = await supabase
        .from("Asset")
        .select("*, AssetModel:ModelID(*, Manufacturer:ManufacturerID(*)), assignments:Assignment(Status, Employee:EmployeeID(FirstName, LastName))")
        .order("createdAt", { ascending: false });

    // Fetch storage locations separately (PostgREST FK join is unreliable)
    const { data: locations } = await supabase
        .from("StorageLocation")
        .select("LocationID, Name, ParentLocationID");

    const locMap: Record<string, any> = {};
    if (locations) {
        for (const loc of locations) locMap[loc.LocationID] = loc;
    }

    // Merge location data into assets
    const assets = (assetsRaw || []).map((asset: any) => {
        if (asset.StorageLocationID && locMap[asset.StorageLocationID]) {
            const loc = locMap[asset.StorageLocationID];
            const parent = loc.ParentLocationID ? locMap[loc.ParentLocationID] : null;
            return {
                ...asset,
                StorageLocation: {
                    ...loc,
                    ParentLocation: parent ? { Name: parent.Name } : null
                }
            };
        }
        return { ...asset, StorageLocation: null };
    });

    // Calculate stats
    const total = assets.length
    const assigned = assets.filter((a: any) => a.Status === 'Assigned').length
    const available = assets.filter((a: any) => a.Status === 'Available').length

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
