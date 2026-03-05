
"use client";

import { useState, useEffect } from "react";
import { duplicateModel, deleteModel } from "@/app/actions/models";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Copy, Loader2, Trash2, AlertTriangle, CheckCircle2, UserPlus } from "lucide-react";
import CreateModelDialog from "./CreateModelDialog";
import EditModelDialog from "./EditModelDialog";
import AddStockDialog from "./AddStockDialog";
import AdjustInventoryDialog from "./AdjustInventoryDialog";
import StockHistoryDialog from "./StockHistoryDialog";

function getStockStatus(available: number, reorderLevel: number): {
    label: string;
    color: string;
    icon: string;
    tooltip: string;
} {
    if (available <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-700 border-red-200', icon: '🔴', tooltip: 'No units available' };
    if (reorderLevel > 0 && available <= reorderLevel) return { label: `Low Stock (${available} left)`, color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🟡', tooltip: `Below reorder level of ${reorderLevel}` };
    return { label: 'Healthy', color: 'bg-green-100 text-green-700 border-green-200', icon: '🟢', tooltip: 'Stock is sufficient' };
}


export default function ModelList({ models, manufacturers }: { models: any[], manufacturers: any[] }) {
    const router = useRouter();
    const [cloningId, setCloningId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [forecastData, setForecastData] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/inventory/forecast")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setForecastData(data);
            })
            .catch(err => console.error("Failed to fetch forecast:", err));
    }, []);

    async function handleClone(modelId: string) {
        setCloningId(modelId);
        const res = await duplicateModel(modelId);
        if (res.success) {
            router.refresh();
        } else {
            alert("Failed to clone model");
        }
        setCloningId(null);
    }

    async function handleDelete(modelId: string, modelName: string) {
        if (!confirm(`Are you sure you want to delete the model "${modelName}"?`)) {
            return;
        }

        setDeletingId(modelId);
        const res = await deleteModel(modelId);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.error || "Failed to delete model.");
        }
        setDeletingId(null);
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Asset Models</h1>
                    <p className="text-muted-foreground">
                        Define abstract equipment models (e.g. Dell Latitude 5520).
                    </p>
                </div>
                <CreateModelDialog manufacturers={manufacturers} />
            </div>

            <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="h-12 px-4 align-middle font-medium">Model Name</th>
                            <th className="h-12 px-4 align-middle font-medium">Series</th>
                            <th className="h-12 px-4 align-middle font-medium">Manufacturer</th>
                            <th className="h-12 px-4 align-middle font-medium">Category</th>
                            <th className="h-12 px-4 align-middle font-medium text-center">Total Stock</th>
                            <th className="h-12 px-4 align-middle font-medium text-center">Available</th>
                            <th className="h-12 px-4 align-middle font-medium text-center">Assigned</th>
                            <th className="h-12 px-4 align-middle font-medium text-center">Status</th>
                            <th className="h-12 px-4 align-middle font-medium text-center">Runway</th>
                            <th className="h-12 px-4 align-middle font-medium">Active Devices</th>
                            <th className="h-12 px-4 align-middle font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {models.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                    No models found.
                                </td>
                            </tr>
                        ) : (
                            models.map((m) => (
                                <tr key={m.ModelID} className="border-t hover:bg-muted/50 transition-colors">
                                    <td className="p-4 font-medium">
                                        <Link
                                            href={`/inventory/cmdb/models/${m.ModelID}`}
                                            className="flex flex-col hover:text-blue-600 transition-colors group"
                                        >
                                            <span className="group-hover:underline">{m.Name}</span>
                                            {m.ModelNumber && <span className="text-xs text-muted-foreground">{m.ModelNumber}</span>}
                                        </Link>
                                    </td>
                                    <td className="p-4">
                                        {m.Series ? (
                                            <span className="text-sm text-gray-700">{m.Series}</span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="p-4">{m.Manufacturer.Name}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                                            {m.Category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-semibold text-gray-900">{m.TotalStock || 0}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`font-semibold px-2 py-0.5 rounded ${(m.AvailableStock || 0) <= 0
                                            ? "bg-red-100 text-red-700 border border-red-200"
                                            : "text-green-600"
                                            }`}>
                                            {m.AvailableStock || 0}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="font-semibold text-blue-600">{m.AssignedStock || 0}</span>
                                    </td>
                                    {/* ✅ Status badge - Low Stock Alert */}
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                            {(() => {
                                                const status = getStockStatus(m.AvailableStock || 0, m.ReorderLevel || 0);
                                                return (
                                                    <span
                                                        title={status.tooltip}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${status.color} cursor-default`}
                                                    >
                                                        {status.icon} {status.label}
                                                    </span>
                                                );
                                            })()}
                                            {(m.AvailableStock || 0) <= 0 && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-red-500 font-bold animate-pulse">Action needed:</span>
                                                    <AddStockDialog model={m} triggerLabel="Quick Refill" variant="ghost-red" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    {/* ✅ Runway Forecast column */}
                                    <td className="p-4 text-center">
                                        {(() => {
                                            const forecast = forecastData.find(f => f.modelId === m.ModelID);
                                            if (!forecast || forecast.estimated_days_left === null) {
                                                return <span className="text-[10px] text-gray-400 font-medium italic">No usage data</span>;
                                            }

                                            const days = forecast.estimated_days_left;
                                            const runwayStatus = days < 5 ? { label: "Reorder Now", color: "text-red-600 bg-red-50 border-red-200" } :
                                                days < 14 ? { label: "Refill Soon", color: "text-orange-600 bg-orange-50 border-orange-200" } :
                                                    { label: "Healthy", color: "text-green-600 bg-green-50 border-green-200" };

                                            return (
                                                <div className="flex flex-col items-center gap-1 min-w-[100px]">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${runwayStatus.color}`}>
                                                        {runwayStatus.label} ({days}d)
                                                    </span>
                                                    {/* Visual bar */}
                                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${days < 5 ? 'bg-red-500' : days < 14 ? 'bg-orange-500' : 'bg-green-500'}`}
                                                            style={{ width: `${Math.min(100, (days / 30) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-medium text-gray-500">
                                            {m._count.assets} instances
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2 items-center">
                                        <Link
                                            href={`/assign?modelId=${m.ModelID}`}
                                            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-8 px-3 gap-1.5 ${(m.AvailableStock || 0) <= 0
                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-300 opacity-60 grayscale shadow-none"
                                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
                                                }`}
                                            title={(m.AvailableStock || 0) <= 0 ? "No stock available" : "Assign Device"}
                                            onClick={(e) => {
                                                if ((m.AvailableStock || 0) <= 0) e.preventDefault();
                                            }}
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            <span>Assign</span>
                                        </Link>
                                        <AddStockDialog model={m} />
                                        <StockHistoryDialog model={m} />
                                        <AdjustInventoryDialog model={m} />
                                        <button
                                            onClick={() => handleClone(m.ModelID)}
                                            disabled={cloningId === m.ModelID}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8"
                                            title="Clone Model"
                                        >
                                            {cloningId === m.ModelID ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </button>
                                        <EditModelDialog model={m} manufacturers={manufacturers} />
                                        <button
                                            onClick={() => handleDelete(m.ModelID, m.Name)}
                                            disabled={deletingId === m.ModelID}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-transparent bg-background text-red-600 hover:bg-red-50 hover:text-red-700 h-8 w-8"
                                            title="Delete Model"
                                        >
                                            {deletingId === m.ModelID ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
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
