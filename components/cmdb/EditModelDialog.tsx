"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Box, Layers, Tag, X, GitBranch, Bell, MapPin, Plus } from "lucide-react";
import { updateModelAction } from "@/app/actions/models";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import StorageLocationSelect from "@/components/StorageLocationSelect";

export default function EditModelDialog({
    model,
    manufacturers,
    triggerLabel = "Edit Model",
    variant = "default"
}: {
    model: any,
    manufacturers: { ManufacturerID: string, Name: string }[],
    triggerLabel?: string,
    variant?: "default" | "dropdown"
}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [locationId, setLocationId] = useState(model.DefaultLocationID || "");
    const [category, setCategory] = useState(model.Category || "");
    const [color, setColor] = useState(model.Color || "");
    const [imageUrl, setImageUrl] = useState(model.ImageURL || "");
    const [uploading, setUploading] = useState(false);

    useEscapeKey(() => setOpen(false), open);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            setImageUrl(data.url);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
        }
    }

    async function handleSubmit(formData: FormData) {
        if (locationId) {
            formData.set("defaultLocationId", locationId);
        }
        if (imageUrl) {
            formData.set("imageUrl", imageUrl);
        }
        if (category === "Consumable") {
            formData.set("color", color);
        }
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
            {variant === "dropdown" ? (
                <button
                    onClick={() => setOpen(true)}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                    <Edit2 className="h-4 w-4 text-emerald-500" />
                    {triggerLabel}
                </button>
            ) : (
                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8"
                    title={triggerLabel}
                >
                    <Edit2 className="h-4 w-4" />
                </button>
            )}
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
                                            onChange={(e) => setCategory(e.target.value)}
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

                                {category === "Consumable" && (
                                    <div className="grid gap-2 animate-in fade-in slide-in-from-top-1">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full border border-gray-300 bg-gradient-to-tr from-cyan-400 via-magenta-400 to-yellow-400" /> Color / Toner Type
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { name: 'Black', bg: 'bg-[#000000]' },
                                                { name: 'Cyan', bg: 'bg-[#00FFFF]' },
                                                { name: 'Magenta', bg: 'bg-[#FF00FF]' },
                                                { name: 'Yellow', bg: 'bg-[#FFFF00]' }
                                            ].map((c) => (
                                                <button
                                                    key={c.name}
                                                    type="button"
                                                    onClick={() => setColor(c.name)}
                                                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${color === c.name
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded-full border border-black/10 ${c.bg}`} />
                                                    <span className="text-xs font-medium">{c.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <input type="hidden" name="color" value={color} />
                                    </div>
                                )}

                                {/* Image Upload */}
                                <div className="grid gap-1.5 pt-2 border-t border-gray-100">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Tag className="h-3.5 w-3.5 text-gray-400" /> Model Image
                                    </label>
                                    <div className="flex items-center gap-4">
                                        {imageUrl ? (
                                            <div className="relative w-20 h-20 rounded-lg border overflow-hidden group">
                                                <Image src={imageUrl} alt="Preview" fill unoptimized sizes="80px" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setImageUrl("")}
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                                                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                                                <Plus className="h-5 w-5 text-gray-400" />
                                                <span className="text-[10px] text-gray-400 mt-1">{uploading ? "..." : "Upload"}</span>
                                            </label>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500">Edit the photo of the toner or hardware model.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Layers className="h-3.5 w-3.5 text-gray-400" /> Condition / Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="status"
                                            defaultValue={model.Status || ""}
                                            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                        >
                                            <option value="">Select Status</option>
                                            <option value="New">New</option>
                                            <option value="Used">Used</option>
                                            <option value="Unboxed-new">Unboxed-new</option>
                                            <option value="Boxed-new">Boxed-new</option>
                                            <option value="Damaged">Damaged</option>
                                            <option value="Returned">Returned</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Inventory Alert */}
                            <div className="grid gap-1.5 pt-2 border-t border-gray-100">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Bell className="h-3.5 w-3.5 text-orange-400" /> Reorder Level (Low Stock Alert)
                                </label>
                                <input
                                    name="reorderLevel"
                                    type="number"
                                    min="0"
                                    defaultValue={model.ReorderLevel || 0}
                                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-400">Alert will trigger when Available Stock ≤ this number. Set to 0 to disable.</p>
                            </div>

                            {/* Storage Location */}
                            <div className="grid gap-1.5 pt-2 border-t border-gray-100">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5 text-gray-400" /> Default Storage Location
                                </label>
                                <StorageLocationSelect
                                    value={locationId}
                                    onChange={(val) => setLocationId(val)}
                                />
                                <input type="hidden" name="defaultLocationId" value={locationId} />
                                <p className="text-xs text-gray-400">The primary warehouse or room where this model is kept.</p>
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

