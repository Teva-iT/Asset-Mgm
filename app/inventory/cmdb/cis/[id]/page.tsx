
import { getCIById } from "@/app/actions/getCI";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CIDetailPage({ params }: { params: { id: string } }) {
    const ci = await getCIById(params.id);

    if (!ci) {
        notFound();
    }

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {ci.AssetTag || ci.DeviceTag || "No Tag"}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        {ci.AssetModel?.Manufacturer?.Name} {ci.AssetModel?.Name}
                        <span className="mx-2">•</span>
                        <span className="font-mono text-sm">{ci.SerialNumber}</span>
                    </p>
                </div>
                <div className="flex space-x-3">
                    <Link href={`/inventory/cmdb/cis/${ci.AssetID}/edit`} className="px-4 py-2 border rounded hover:bg-gray-50">
                        Edit
                    </Link>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Assign / Action
                    </button>
                    {/* Procurement Button for Printers */}
                    {ci.AssetModel?.Category === 'Printer' && (
                        <Link href={`/inventory/procurement/new?modelId=${ci.AssetModel.ModelID}&fromCi=${ci.AssetID}`} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                            Order Consumables
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Details</h3>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1 text-sm text-gray-900 font-semibold">{ci.Status}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Condition</dt>
                                <dd className="mt-1 text-sm text-gray-900">{ci.Condition}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Location</dt>
                                <dd className="mt-1 text-sm text-gray-900">{ci.Location || "N/A"}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Category</dt>
                                <dd className="mt-1 text-sm text-gray-900">{ci.AssetModel?.Category || ci.AssetType}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Model Specifications</h3>
                        {ci.AssetModel ? (
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{ci.AssetModel.Manufacturer.Name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Model Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{ci.AssetModel.Name}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{ci.AssetModel.Description || "-"}</dd>
                                </div>
                            </dl>
                        ) : (
                            <div className="text-yellow-600 bg-yellow-50 p-4 rounded text-sm">
                                Linked to legacy string data. Migrate to AssetModel for full specs.
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar / History */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Current Assignment</h3>
                        {ci.assignments && ci.assignments.length > 0 && ci.assignments.some(a => a.Status === 'Active') ? (
                            <div>
                                {/* Logic to find active assignment */}
                                {ci.assignments.filter(a => a.Status === 'Active').map(a => (
                                    <div key={a.AssignmentID}>
                                        <div className="font-medium text-lg">{a.Employee.FirstName} {a.Employee.LastName}</div>
                                        <div className="text-sm text-gray-500">{a.Employee.Department}</div>
                                        <div className="text-xs text-gray-400 mt-2">Assigned: {new Date(a.AssignedDate).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-500 italic">Not currently assigned</div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                        <ul className="space-y-3">
                            {ci.ScanHistory && ci.ScanHistory.map(scan => (
                                <li key={scan.ScanID} className="text-sm">
                                    <div className="font-medium">Scanned: {scan.Outcome}</div>
                                    <div className="text-xs text-gray-500">{new Date(scan.ScannedAt).toLocaleString()}</div>
                                </li>
                            ))}
                            {!ci.ScanHistory || ci.ScanHistory.length === 0 && (
                                <li className="text-gray-500 text-sm">No scan history</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
