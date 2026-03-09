"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, MapPin } from "lucide-react";
import { adjustStockAction } from "@/app/actions/models";
import StorageLocationSelect from "@/components/StorageLocationSelect";
import { useEscapeKey } from "@/hooks/useEscapeKey";

const REASONS = [
    { value: "location_change", label: "Location Change / Relocation" },
    { value: "correction", label: "Correction / Counting Error" },
    { value: "damaged", label: "Damaged / Broken" },
    { value: "lost", label: "Lost / Missing" },
    { value: "other", label: "Other" },
];

export default function AdjustInventoryDialog({
    model,
    triggerLabel = "Adjust",
    variant = "default"
}: {
    model: any,
    triggerLabel?: string,
    variant?: "default" | "dropdown"
}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [newStock, setNewStock] = useState<number>(model.TotalStock || 0);

    const [locationId, setLocationId] = useState("");
    const [locationError, setLocationError] = useState("");

    const currentStock = model.TotalStock || 0;
    const diff = newStock - currentStock;
    const diffLabel = diff > 0 ? `+${diff}` : `${diff}`;
    const diffColor = diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-gray-400";

    useEscapeKey(() => setOpen(false), open);

    function resetForm() {
        setNewStock(model.TotalStock || 0);
        setLocationId("");
        setLocationError("");
        setError("");
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLocationError("");


        if (!locationId) {
            setLocationError("Storage Location is required.");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        formData.set("modelId", model.ModelID);
        formData.set("currentStock", String(currentStock));
        formData.set("newStock", String(newStock));
        formData.set("difference", String(diff));
        formData.set("storageLocationId", locationId);

        try {
            const res = await adjustStockAction(formData);
            if (res.success) {
                setOpen(false);
                router.refresh();
            } else {
                setError(res.error || "Failed to adjust stock");
            }
        } catch (err: any) {
            setError(err.message || "Failed to adjust stock");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            {variant === "dropdown" ? (
                <button
                    onClick={() => { setOpen(true); resetForm(); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <SlidersHorizontal className="h-4 w-4 text-orange-500" />
                    {triggerLabel}
                </button>
            ) : (
                <button
                    onClick={() => { setOpen(true); resetForm(); }}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-orange-50 text-orange-700 hover:bg-orange-100 h-8 px-3"
                    title="Adjust Inventory"
                >
                    <SlidersHorizontal className="h-4 w-4 mr-1" />
                    Adjust
                </button>
            )}

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[440px] overflow-hidden border border-gray-100">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div className="flex gap-3">
                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <SlidersHorizontal className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Adjust Inventory</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Correct stock count for {model.Name}</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-md text-sm">{error}</div>
                            )}

                            {/* Current Stock display */}
                            <div className="flex gap-4 items-center justify-between bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Current Stock</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-1">{currentStock}</p>
                                </div>
                                <div className="text-2xl text-gray-300">→</div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">New Stock</p>
                                    <p className={`text-3xl font-bold mt-1 ${newStock !== currentStock ? 'text-blue-600' : 'text-gray-900'}`}>{newStock}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Difference</p>
                                    <p className={`text-2xl font-bold mt-1 ${diffColor}`}>{diff !== 0 ? diffLabel : "—"}</p>
                                </div>
                            </div>

                            {/* New stock input */}
                            <div className="grid gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">
                                    New Stock Count <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newStock}
                                    onChange={(e) => setNewStock(Number(e.target.value))}
                                    required
                                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            {/* Storage Location */}
                            <div className="grid gap-1.5">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                    Storage Location (Warehouse / Room) <span className="text-red-500">*</span>
                                </label>
                                <StorageLocationSelect
                                    value={locationId}
                                    onChange={(val) => {
                                        setLocationId(val);
                                        if (val) setLocationError("");
                                    }}
                                    error={locationError}
                                />
                                {locationError && (
                                    <p className="text-red-500 text-xs">{locationError}</p>
                                )}
                            </div>

                            {/* Reason */}
                            <div className="grid gap-1.5">
                                <label className="text-sm font-semibold text-gray-700">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="reason"
                                    required
                                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="">Select reason...</option>
                                    {REASONS.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="grid gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Notes</label>
                                <textarea
                                    name="notes"
                                    rows={2}
                                    placeholder="Optional details..."
                                    className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-300"
                                />
                            </div>

                            <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setOpen(false)} disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting}
                                    className="px-6 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-md transition-all disabled:opacity-50">
                                    {isSubmitting ? "Saving..." : "Apply Adjustment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
