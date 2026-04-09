import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AssetList from '@/components/AssetList'

export const revalidate = 30

export default async function AssetsPage() {
    const [{ data: models }, { data: assetsRaw }, { data: locations }] = await Promise.all([
        supabase.from("AssetModel").select("TotalStock, AvailableStock, AssignedStock"),
        supabase
            .from("Asset")
            .select("AssetID, AssetType, AssetName, Brand, Model, SerialNumber, DeviceTag, Status, Condition, Location, StorageLocationID, WarrantyExpiryDate, updatedAt, AssetModel:ModelID(Name, Manufacturer:ManufacturerID(Name)), assignments:Assignment(Status, Employee:EmployeeID(FirstName, LastName))")
            .order("createdAt", { ascending: false }),
        supabase
            .from("StorageLocation")
            .select("LocationID, Name, ParentLocationID")
    ]);

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
    const totalAssets = assets.length;
    const assignedAssets = assets.filter((a: any) => a.Status === 'Assigned').length;
    const availableAssets = assets.filter((a: any) => a.Status === 'Available').length;

    const totalModels = models?.length || 0;
    const totalBulkStock = models?.reduce((acc: number, m: any) => acc + (m.TotalStock || 0), 0) || 0;
    const availableBulkStock = models?.reduce((acc: number, m: any) => acc + (m.AvailableStock || 0), 0) || 0;
    const assignedBulkStock = models?.reduce((acc: number, m: any) => acc + (m.AssignedStock || 0), 0) || 0;

    return (
        <div className="container space-y-6 max-w-7xl mx-auto py-6">

            {/* Inventory Summary Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Models Defined</span>
                    <span className="text-3xl font-bold text-gray-900 mt-1">{totalModels}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Total System Devices / Stock</span>
                    <span className="text-3xl font-bold text-blue-600 mt-1">{totalAssets + totalBulkStock}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Available Base Stock</span>
                    <span className="text-3xl font-bold text-green-600 mt-1">{availableBulkStock}</span>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Assigned Instances</span>
                    <span className="text-3xl font-bold text-indigo-600 mt-1">{assignedAssets + assignedBulkStock}</span>
                </div>
            </div>

            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Tracked Hardware Assets</h1>
                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        <span><strong>{totalAssets}</strong> Registered</span>
                        <span className="text-green-600"><strong>{availableAssets}</strong> Available</span>
                        <span className="text-blue-600"><strong>{assignedAssets}</strong> Assigned</span>
                    </div>
                </div>
                <Link href="/assets/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2">
                    + Add Asset
                </Link>
            </div>

            <AssetList initialAssets={assets} />
        </div>
    )
}
