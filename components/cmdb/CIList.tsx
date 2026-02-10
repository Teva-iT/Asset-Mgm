
"use client";

import CreateCIDialog from "./CreateCIDialog";
import Link from "next/link";

export default function CIList({ cis, models }: { cis: any[], models: any[] }) {
    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Configuration Items (CIs)</h1>
                    <p className="text-muted-foreground">
                        Physical instances of tracked hardware and assets.
                    </p>
                </div>
                <CreateCIDialog models={models} />
            </div>

            <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="h-12 px-4 align-middle font-medium">Asset Tag</th>
                            <th className="h-12 px-4 align-middle font-medium">Model</th>
                            <th className="h-12 px-4 align-middle font-medium">Serial Number</th>
                            <th className="h-12 px-4 align-middle font-medium">Status</th>
                            <th className="h-12 px-4 align-middle font-medium">Location</th>
                            <th className="h-12 px-4 align-middle font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cis.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                    No CIs found.
                                </td>
                            </tr>
                        ) : (
                            cis.map((ci) => (
                                <tr key={ci.AssetID} className="border-t hover:bg-muted/50 transition-colors">
                                    <td className="p-4 font-medium">{ci.AssetTag || ci.DeviceTag || "-"}</td>
                                    <td className="p-4">
                                        {ci.AssetModel ? (
                                            <div className="flex flex-col">
                                                <span className="font-medium">{ci.AssetModel.Manufacturer?.Name} {ci.AssetModel.Name}</span>
                                                <span className="text-xs text-muted-foreground">{ci.AssetModel.Category}</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col text-muted-foreground">
                                                {/* Fallback for legacy data not yet migrated */}
                                                <span>{ci.Brand} {ci.Model}</span>
                                                <span className="text-xs text-red-400">Legacy Data</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 font-mono text-xs">{ci.SerialNumber}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold
                        ${ci.Status === 'Available' ? 'bg-green-100 text-green-800' :
                                                ci.Status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {ci.Status}
                                        </span>
                                    </td>
                                    <td className="p-4">{ci.Location || "-"}</td>
                                    <td className="p-4 text-right">
                                        <Link href={`/inventory/cmdb/cis/${ci.AssetID}`} className="text-blue-600 hover:text-blue-800 hover:underline">
                                            Details
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
