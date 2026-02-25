"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Box, Layers, Tag, X, GitBranch } from "lucide-react";
import { updateModelAction } from "@/app/actions/models";

export default function EditModelDialog({
    model,
    manufacturers
}: {
    model: any,
    manufacturers: { ManufacturerID: string, Name: string }[]
}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        const res = await updateModelAction(model.ModelID, formData);
        if (res.success) {
            setOpen(false);
            router.refresh();
        } else {
            alert(res.error || "Failed to update model");
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8"
                title="Edit Model"
            >
                <Edit2 className="h-4 w-4" />
            </button>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[520px] overflow-hidden border border-gray-100">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div className="flex gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Box className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Edit Asset Model</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Modify properties of {model.Name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form action={handleSubmit} className="p-6 space-y-8 text-left">

                            {/* Primary Info */}
                            <div className="space-y-5">
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-semibold text-gray-700">
                                        Model Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="name"
                                        defaultValue={model.Name}
                                        required
                                        autoFocus
                                        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <GitBranch className="h-3.5 w-3.5 text-gray-400" /> Series / Product Line
                                    </label>
                                    <input
                                        name="series"
                                        defaultValue={model.Series || ""}
                                        placeholder="e.g. ThinkVision, ThinkPad, Latitude, ProBook"
                                        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                                    />
                                    <p className="text-xs text-muted-foreground">Optional — the product family or series name.</p>
                                </div>

                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Layers className="h-3.5 w-3.5 text-gray-400" /> Manufacturer (Primary Association) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="manufacturerId"
                                            defaultValue={model.ManufacturerID}
                                            required
                                            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                        >
                                            <option value="">Select Manufacturer</option>
                                            {manufacturers.map(m => (
                                                <option key={m.ManufacturerID} value={m.ManufacturerID}>{m.Name}</option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Tag className="h-3.5 w-3.5 text-gray-400" /> Category (Classification) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="category"
                                            defaultValue={model.Category}
                                            required
                                            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Laptop">Laptop</option>
                                            <option value="Desktop">Desktop</option>
                                            <option value="Monitor">Monitor</option>
                                            <option value="Printer">Printer</option>
                                            <option value="Consumable">Consumable (Toner/Ink)</option>
                                            <option value="Mobile">Mobile Phone</option>
                                            <option value="Tablet">Tablet</option>
                                            <option value="Accessory">Accessory</option>
                                            <option value="Server">Server</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

