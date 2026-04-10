"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Box, Layers, Tag, X, GitBranch, Bell, MapPin, Plus, ExternalLink, CalendarDays, PackagePlus, StickyNote } from "lucide-react";
import { updateModelAction } from "@/app/actions/models";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import StorageLocationSelect from "@/components/StorageLocationSelect";
import AssetTypeSelect from "@/components/AssetTypeSelect";
import AssetTypeIcon from "@/components/AssetTypeIcon";
import ManufacturerSelect from "@/components/ManufacturerSelect";

type ReferencePhoto = { URL: string; Category: string };

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
    const [manufacturerId, setManufacturerId] = useState(model.ManufacturerID || "");
    const [assetTypes, setAssetTypes] = useState<{ Name: string }[]>([]);
    const [color, setColor] = useState(model.Color || "");
    const [referencePhotos, setReferencePhotos] = useState<ReferencePhoto[]>(() => {
        const incomingPhotos = Array.isArray(model.ModelPhotos) ? model.ModelPhotos : [];
        if (incomingPhotos.length > 0) {
            return incomingPhotos.map((photo: any) => ({
                URL: photo.URL,
                Category: photo.Category || "Reference",
            }));
        }

        if (model.ImageURL) {
            return [{ URL: model.ImageURL, Category: "Reference" }];
        }

        return [];
    });
    const [uploading, setUploading] = useState(false);

    const modalRef = useModalDismiss<HTMLDivElement>(() => setOpen(false), open);

    useEffect(() => {
        const fetchAssetTypes = async () => {
            try {
                const res = await fetch('/api/asset-types');
                if (!res.ok) throw new Error('Failed to fetch asset types');
                const data = await res.json();
                setAssetTypes(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch asset types', error);
            }
        };

        fetchAssetTypes();
    }, []);

    useEffect(() => {
        if (!open) return;

        setLocationId(model.DefaultLocationID || "");
        setCategory(model.Category || "");
        setManufacturerId(model.ManufacturerID || "");
        setColor(model.Color || "");
        setReferencePhotos(
            Array.isArray(model.ModelPhotos) && model.ModelPhotos.length > 0
                ? model.ModelPhotos.map((photo: any) => ({
                    URL: photo.URL,
                    Category: photo.Category || "Reference",
                }))
                : (model.ImageURL ? [{ URL: model.ImageURL, Category: "Reference" }] : [])
        );
    }, [open, model]);

    const categoryOptions = (() => {
        const options = assetTypes.map((type) => type.Name).filter(Boolean);
        return category && !options.includes(category) ? [category, ...options] : options;
    })();
    const canSeedInitialExistingStock = (model.TotalStock || 0) === 0;

    const isConsumableCategory = category.toLowerCase().includes("consumable")
        || category.toLowerCase().includes("toner")
        || category.toLowerCase().includes("ink");

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);
        setUploading(true);
        try {
            const uploadedPhotos = await Promise.all(files.map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                if (!res.ok) throw new Error('Upload failed');
                const data = await res.json();
                return { URL: data.url, Category: 'Reference' } as ReferencePhoto;
            }));

            setReferencePhotos((prev) => [...prev, ...uploadedPhotos]);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    }

    function removePhoto(indexToRemove: number) {
        setReferencePhotos((prev) => prev.filter((_, index) => index !== indexToRemove));
    }

    function makePrimary(indexToPromote: number) {
        setReferencePhotos((prev) => {
            const next = [...prev];
            const [photo] = next.splice(indexToPromote, 1);
            next.unshift(photo);
            return next;
        });
    }

    async function handleSubmit(formData: FormData) {
        if (locationId) {
            formData.set("defaultLocationId", locationId);
        }
        if (referencePhotos[0]?.URL) {
            formData.set("imageUrl", referencePhotos[0].URL);
        } else {
            formData.set("imageUrl", "");
        }
        formData.set("photos", JSON.stringify(referencePhotos.map((photo) => ({ url: photo.URL, category: photo.Category }))));
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
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm transition-opacity">
                    <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
                    <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-[520px] max-h-[calc(100vh-2rem)] overflow-hidden border border-gray-100 flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 flex-shrink-0">
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

                        <form action={handleSubmit} className="p-6 space-y-8 text-left overflow-y-auto">

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
                                    <ManufacturerSelect
                                        value={manufacturerId}
                                        onChange={setManufacturerId}
                                        options={manufacturers}
                                        placeholder="Select Manufacturer"
                                    />
                                    <input type="hidden" name="manufacturerId" value={manufacturerId} required />
                                </div>

                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Tag className="h-3.5 w-3.5 text-gray-400" /> Category (Classification) <span className="text-red-500">*</span>
                                    </label>
                                    <AssetTypeSelect
                                        value={category}
                                        onChange={setCategory}
                                        options={categoryOptions}
                                        placeholder="Select Category"
                                    />
                                    <input type="hidden" name="category" value={category} />
                                    {category && (
                                        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                                            <AssetTypeIcon type={category} className="h-4 w-4" />
                                            <span>Selected category: <strong>{category}</strong></span>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400">Category choices are now read from the `AssetType` table.</p>
                                </div>

                                {isConsumableCategory && (
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
                                        <Tag className="h-3.5 w-3.5 text-gray-400" /> Reference Images
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {referencePhotos.map((photo, index) => (
                                            <div key={`${photo.URL}-${index}`} className="rounded-lg border border-gray-200 overflow-hidden bg-white">
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(photo.URL, "_blank", "noopener,noreferrer")}
                                                    className="relative w-full aspect-square group"
                                                    title="Open uploaded reference image"
                                                >
                                                    <Image src={photo.URL} alt={`Reference ${index + 1}`} fill unoptimized sizes="160px" className="object-cover" />
                                                    <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[10px] px-1.5 py-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ExternalLink className="h-3 w-3" />
                                                        View
                                                    </span>
                                                </button>
                                                <div className="p-2 space-y-2">
                                                    {index === 0 ? (
                                                        <div className="text-[11px] font-semibold text-blue-600">Primary reference</div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => makePrimary(index)}
                                                            className="text-[11px] font-medium text-blue-600 hover:text-blue-800"
                                                        >
                                                            Set as primary
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(index)}
                                                        className="text-[11px] font-medium text-red-600 hover:text-red-700"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <label className="min-h-28 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                                            <input type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                                            <Plus className="h-5 w-5 text-gray-400" />
                                            <span className="text-[10px] text-gray-400 mt-1">{uploading ? "Uploading..." : "Upload"}</span>
                                        </label>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">You can keep several reference images attached to this model.</p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            The first image is treated as the primary reference across the inventory UI.
                                        </p>
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

                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" /> Purchase Date
                                    </label>
                                    <input
                                        name="purchaseDate"
                                        type="date"
                                        defaultValue={model.PurchaseDate ? new Date(model.PurchaseDate).toISOString().split('T')[0] : ""}
                                        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="text-xs text-gray-400">Stored as part of the model details, close to status and stock metadata.</p>
                                </div>

                                {canSeedInitialExistingStock && (
                                    <div className="grid gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <PackagePlus className="h-3.5 w-3.5 text-emerald-600" /> Initial Existing Stock
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                This model still has zero stock, so you can use this one-time onboarding block to register the existing units already on hand.
                                            </p>
                                        </div>

                                        <div className="grid gap-1.5">
                                            <label className="text-sm font-medium text-gray-700">Existing Quantity On Hand</label>
                                            <input
                                                name="initialExistingStock"
                                                type="number"
                                                min="0"
                                                defaultValue="0"
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            />
                                            <p className="text-xs text-gray-400">Only use this once for models that were created earlier but never received their opening stock in the system.</p>
                                        </div>

                                        <div className="grid gap-1.5">
                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <CalendarDays className="h-3.5 w-3.5 text-gray-400" /> Existing Stock Counted / Known Since
                                            </label>
                                            <input
                                                name="initialExistingStockDate"
                                                type="date"
                                                defaultValue={new Date().toISOString().split('T')[0]}
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div className="grid gap-1.5">
                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <StickyNote className="h-3.5 w-3.5 text-gray-400" /> Opening Stock Notes
                                            </label>
                                            <textarea
                                                name="initialExistingStockNotes"
                                                rows={2}
                                                placeholder="Counted during onboarding, previously in storage before system setup..."
                                                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                )}
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
                            <div className="sticky bottom-0 -mx-6 mt-2 flex justify-end items-center gap-3 border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-sm">
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
                </div>
            )}
        </>
    );
}

