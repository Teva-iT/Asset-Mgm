
"use client";

import CreateCIDialog from "./CreateCIDialog";
import EditCIDialog from "./EditCIDialog";
import Link from "next/link";
import { useState } from "react";
import { deleteConfigurationItem } from "@/app/actions/ci";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CIList({ cis, models }: { cis: any[], models: any[] }) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function handleDelete(assetId: string, assetName: string) {
        if (!confirm(`Are you sure you want to delete the hardware asset "${assetName}"?`)) {
            return;
        }

        setDeletingId(assetId);
        const res = await deleteConfigurationItem(assetId);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.error || "Failed to delete asset.");
        }
        setDeletingId(null);
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Hardware Assets (CIs)</h1>
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
                                    <td className="p-4">
                                        {ci.StorageLocation ? (
                                            <span className="text-sm text-gray-700">
                                                {ci.StorageLocation.ParentLocation
                                                    ? `${ci.StorageLocation.ParentLocation.Name} › ${ci.StorageLocation.Name}`
                                                    : ci.StorageLocation.Name}
                                            </span>
                                        ) : ci.Location ? (
                                            <span className="text-sm text-gray-500">{ci.Location}</span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <EditCIDialog ci={ci} models={models} />
                                        <button
                                            onClick={() => handleDelete(ci.AssetID, ci.AssetTag || ci.SerialNumber)}
                                            disabled={deletingId === ci.AssetID}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-transparent bg-background text-red-600 hover:bg-red-50 hover:text-red-700 h-8 w-8"
                                            title="Delete Asset"
                                        >
                                            {deletingId === ci.AssetID ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                        <Link href={`/inventory/cmdb/cis/${ci.AssetID}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 ml-2">
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
