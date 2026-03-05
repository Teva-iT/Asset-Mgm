"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, PackagePlus, Calendar, Box, StickyNote, X } from "lucide-react";
import { addStockAction } from "@/app/actions/models";
import StorageLocationSelect from "@/components/StorageLocationSelect";

export default function AddStockDialog({ model }: { model: any }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setError("");

        // inject model id
        formData.set("modelId", model.ModelID);

        try {
            const res = await addStockAction(formData);
            if (res.success) {
                setOpen(false);
                router.refresh();
            } else {
                setError(res.error || "Failed to add stock");
            }
        } catch (e: any) {
            setError(e.message || "Failed to add stock");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring border border-input bg-green-50 text-green-700 hover:bg-green-100 h-8 px-3"
                title="Add Stock"
            >
                <Plus className="h-4 w-4 mr-1" />
                Stock
            </button>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden border border-gray-100">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div className="flex gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                                    <PackagePlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Add Inventory Stock</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Record new incoming units for this model</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form action={handleSubmit} className="p-6 space-y-6">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Box className="h-3.5 w-3.5 text-gray-400" /> Target Model
                                    </label>
                                    <div className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 font-medium">
                                        {model.Manufacturer?.Name} {model.Name}
                                    </div>
                                </div>

                                <div className="grid gap-1.5 flex-1">
                                    <label className="text-sm font-semibold text-gray-700">
                                        Quantity <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="quantity"
                                        type="number"
                                        min="1"
                                        defaultValue="1"
                                        required
                                        autoFocus
                                        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-muted-foreground">Number of units added to stock.</p>
                                </div>

                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-gray-400" /> Purchase / Arrival Date
                                    </label>
                                    <input
                                        name="purchaseDate"
                                        type="date"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-700">
                                        Storage Location
                                    </label>
                                    <StorageLocationSelect
                                        onChange={(val) => {
                                            const input = document.getElementById('hidden-storage-location-stock') as HTMLInputElement;
                                            if (input) input.value = val;
                                        }}
                                    />
                                    <input type="hidden" name="storageLocationId" id="hidden-storage-location-stock" />
                                </div>

                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <StickyNote className="h-3.5 w-3.5 text-gray-400" /> Notes
                                    </label>
                                    <textarea
                                        name="notes"
                                        rows={2}
                                        placeholder="Order references or delivery notes..."
                                        className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "Saving..." : "Add Stock"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
