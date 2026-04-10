"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, PackagePlus, Calendar, Box, StickyNote, X, MapPin } from "lucide-react";
import { addStockAction } from "@/app/actions/models";
import StorageLocationSelect from "@/components/StorageLocationSelect";
import { useModalDismiss } from "@/hooks/useModalDismiss";

const STOCK_ENTRY_TYPES = [
    {
        value: "purchase",
        label: "New Purchase / Arrival",
        helper: "Use this when new units were actually bought or delivered now.",
    },
    {
        value: "opening_stock",
        label: "Existing Stock Already On Hand",
        helper: "Use this when the company already had these units and you are registering them in the system for the first time.",
    },
];

export default function AddStockDialog({
    model,
    triggerLabel = "Stock",
    variant = "default"
}: {
    model: any,
    triggerLabel?: string,
    variant?: "default" | "ghost-red" | "dropdown"
}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [entryType, setEntryType] = useState("purchase");

    const modalRef = useModalDismiss<HTMLDivElement>(() => {
        setOpen(false);
        resetForm();
    }, open);

    function resetForm() {
        setError("");
        setEntryType("purchase");
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");

        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        formData.set("modelId", model.ModelID);
        formData.set("entryType", entryType);

        try {
            const res = await addStockAction(formData);
            if (res.success) {
                setOpen(false);
                resetForm();
                router.refresh();
            } else {
                setError(res.error || "Failed to add stock");
            }
        } catch (err: any) {
            setError(err.message || "Failed to add stock");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                onClick={() => { setOpen(true); resetForm(); }}
                className={
                    variant === "ghost-red"
                        ? "flex items-center gap-1 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 px-1.5 py-0.5 rounded border border-red-100 font-bold transition-all"
                        : "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-green-50 text-green-700 hover:bg-green-100 h-8 px-3"
                }
                title="Add Stock"
            >
                <Plus className={variant === "ghost-red" ? "h-3 w-3" : "h-4 w-4 mr-1"} />
                {triggerLabel}
            </button>

            {open && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm">
                    <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
                    <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] max-h-[calc(100vh-2rem)] overflow-hidden border border-gray-100 flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 flex-shrink-0">
                            <div className="flex gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <PackagePlus className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Add Inventory Stock</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Record new incoming units for this model</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-md text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Target Model (readonly) */}
                            <div className="grid gap-1.5">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Box className="h-3.5 w-3.5 text-gray-400" /> Target Model
                                </label>
                                <div className="flex h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 font-medium">
                                    {model.Manufacturer?.Name} {model.Name}
                                </div>
                            </div>

                            {/* Quantity */}
                            <div className="grid gap-1.5">
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
                                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <p className="text-xs text-gray-400">Number of units being added to stock.</p>
                            </div>

                            <div className="grid gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Stock Entry Type</label>
                                <div className="grid gap-2">
                                    {STOCK_ENTRY_TYPES.map((option) => {
                                        const active = entryType === option.value;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setEntryType(option.value)}
                                                className={`text-left rounded-lg border px-3 py-2 transition-colors ${active ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                                            >
                                                <div className={`text-sm font-semibold ${active ? "text-green-700" : "text-gray-800"}`}>{option.label}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{option.helper}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Purchase Date */}
                            <div className="grid gap-1.5">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-gray-400" /> {entryType === "opening_stock" ? "Counted / Known Since" : "Purchase / Arrival Date"}
                                </label>
                                <input
                                    name="purchaseDate"
                                    type="date"
                                    defaultValue={new Date().toISOString().split('T')[0]}
                                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <p className="text-xs text-gray-400">
                                    {entryType === "opening_stock"
                                        ? "Optional date for when this previously existing stock was counted or first recognized in the system."
                                        : "Optional purchase or delivery date for the newly received stock."}
                                </p>
                            </div>


                            {/* Notes */}
                            <div className="grid gap-1.5">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <StickyNote className="h-3.5 w-3.5 text-gray-400" /> Notes
                                </label>
                                <textarea
                                    name="notes"
                                    rows={2}
                                    placeholder={entryType === "opening_stock"
                                        ? "Where these units were found, estimated age, previous tracking notes..."
                                        : "Order number, supplier, delivery reference..."}
                                    className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-300"
                                />
                            </div>

                            {/* Actions */}
                            <div className="sticky bottom-0 -mx-6 mt-2 flex justify-end items-center gap-3 border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-sm">
                                <button
                                    type="button"
                                    onClick={() => { setOpen(false); resetForm(); }}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? "Saving..." : "Add Stock"}
                                </button>
                            </div>
                        </form>
                    </div>
                    </div>
                </div>
            )}
        </>
    );
}
