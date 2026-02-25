
"use client";

import { useState } from "react";
import { duplicateModel, deleteModel } from "@/app/actions/models";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Trash2 } from "lucide-react";
import CreateModelDialog from "./CreateModelDialog";
import EditModelDialog from "./EditModelDialog";

export default function ModelList({ models, manufacturers }: { models: any[], manufacturers: any[] }) {
    const router = useRouter();
    const [cloningId, setCloningId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

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
                            <th className="h-12 px-4 align-middle font-medium">Active Assets</th>
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
                                        <div className="flex flex-col">
                                            <span>{m.Name}</span>
                                            {m.ModelNumber && <span className="text-xs text-muted-foreground">{m.ModelNumber}</span>}
                                        </div>
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
                                    <td className="p-4">
                                        <span className="text-xs font-medium">
                                            {m._count.assets} instances
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
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
