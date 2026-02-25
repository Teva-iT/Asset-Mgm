"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Server, Barcode, HardDrive, MapPin, Activity, X, Search, Check, ChevronDown } from "lucide-react";
import { updateConfigurationItem } from "@/app/actions/ci";
import StorageLocationSelect from "@/components/StorageLocationSelect";

export default function EditCIDialog({ ci, models }: { ci: any, models: any[] }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Default model if available
    const initialModel = ci.AssetModel ? models.find(m => m.ModelID === ci.AssetModel.ModelID) : null;

    // Combobox State
    const [isComboboxOpen, setIsComboboxOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModel, setSelectedModel] = useState<any>(initialModel);
    const [storageLocationId, setStorageLocationId] = useState<string>(ci.StorageLocationID || "");
    const comboboxRef = useRef<HTMLDivElement>(null);

    // Initial setup on open
    useEffect(() => {
        if (open) {
            setSelectedModel(initialModel);
            setSearchQuery("");
            setStorageLocationId(ci.StorageLocationID || "");
            setError("");
        }
    }, [open, initialModel, ci.StorageLocationID]);

    // Filter models based on search
    const filteredModels = searchQuery === ""
        ? models
        : models.filter(m => {
            const fullName = `${m.Manufacturer?.Name} ${m.Name}`.toLowerCase();
            return fullName.includes(searchQuery.toLowerCase());
        });

    // Close combobox on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
                setIsComboboxOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setError("");

        if (!selectedModel) {
            setError("Please select a hardware model.");
            setIsSubmitting(false);
            return;
        }

        // Inject the selected model ID since the input is just for search
        formData.set("modelId", selectedModel.ModelID);

        try {
            const res = await updateConfigurationItem(ci.AssetID, formData);
            if (res.success) {
                setOpen(false);
                router.refresh();
            } else {
                setError(res.error || "Failed to update CI");
            }
        } catch (e) {
            setError("Unexpected error");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8"
                title="Edit Hardware Asset"
            >
                <Edit2 className="h-4 w-4" />
            </button>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity text-left">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] overflow-hidden border border-gray-100 max-h-[90vh] overflow-y-auto">

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 sticky top-0 z-10">
                            <div className="flex gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Server className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Edit Hardware Asset</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Modify properties of {ci.AssetTag || ci.SerialNumber}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form action={handleSubmit} className="p-6 space-y-8">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                                    {error}
                                </div>
                            )}

                            {/* Section 1: Hardware Definition */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <HardDrive className="h-3.5 w-3.5" /> Hardware Definition
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid gap-1.5" ref={comboboxRef}>
                                        <label className="text-sm font-semibold text-gray-700">
                                            Model (Hardware Template) <span className="text-red-500">*</span>
                                        </label>

                                        {/* Custom Combobox */}
                                        <div className="relative">
                                            <div
                                                className="relative flex items-center"
                                                onClick={() => {
                                                    setIsComboboxOpen(true);
                                                }}
                                            >
                                                <Search className="absolute left-3 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={selectedModel ? `${selectedModel.Manufacturer?.Name} ${selectedModel.Name}` : searchQuery}
                                                    onChange={(e) => {
                                                        setSelectedModel(null); // Clear selection on edit
                                                        setSearchQuery(e.target.value);
                                                        setIsComboboxOpen(true);
                                                    }}
                                                    onFocus={() => {
                                                        if (selectedModel) setSearchQuery(""); // Clear display text to allow searching
                                                        setIsComboboxOpen(true);
                                                    }}
                                                    placeholder="Search or Scan Model Name..."
                                                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-8 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
                                                    autoComplete="off"
                                                />
                                                <ChevronDown className={`absolute right-3 h-4 w-4 text-gray-400 transition-transform ${isComboboxOpen ? 'rotate-180' : ''}`} />
                                            </div>

                                            {/* Dropdown Options */}
                                            {isComboboxOpen && (
                                                <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                    {filteredModels.length === 0 ? (
                                                        <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                                            No models found.
                                                        </div>
                                                    ) : (
                                                        filteredModels.map((m) => (
                                                            <div
                                                                key={m.ModelID}
                                                                className="relative cursor-pointer select-none py-2 pl-3 pr-9 hover:bg-blue-50 text-gray-900"
                                                                onClick={() => {
                                                                    setSelectedModel(m);
                                                                    setSearchQuery("");
                                                                    setIsComboboxOpen(false);
                                                                }}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium truncate">{m.Manufacturer?.Name} {m.Name}</span>
                                                                    <span className="text-xs text-gray-500">{m.Category}</span>
                                                                </div>
                                                                {selectedModel?.ModelID === m.ModelID && (
                                                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                                                        <Check className="h-4 w-4" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground flex justify-between">
                                            <span>The abstract model this physical device belongs to.</span>
                                            {selectedModel && <span className="text-green-600 font-medium">✓ Selected</span>}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-1.5">
                                            <label className="text-sm font-semibold text-gray-700">
                                                Serial Number <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                name="serialNumber"
                                                required
                                                defaultValue={ci.SerialNumber}
                                                placeholder="S/N (Scan here)"
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <Barcode className="h-3.5 w-3.5 text-gray-400" /> Asset Tag
                                            </label>
                                            <input
                                                name="assetTag"
                                                defaultValue={ci.AssetTag || ci.DeviceTag}
                                                placeholder="e.g. IT-2024-001"
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100"></div>

                            {/* Section 2: Operational State */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <Activity className="h-3.5 w-3.5" /> Operational State
                                </h3>

                                {/* Status and Condition */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">Status</label>
                                        <div className="relative">
                                            <select
                                                name="status"
                                                defaultValue={ci.Status || "Available"}
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                            >
                                                <option value="Available">Available</option>
                                                <option value="In Stock">In Stock</option>
                                                <option value="Assigned">Assigned</option>
                                                <option value="Damaged">Damaged</option>
                                                <option value="Lost">Lost</option>
                                                <option value="Retired">Retired</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid gap-1.5">
                                        <label className="text-sm font-medium text-gray-700">Condition</label>
                                        <div className="relative">
                                            <select
                                                name="condition"
                                                defaultValue={ci.Condition || "New"}
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                            >
                                                <option value="New">New</option>
                                                <option value="Used (Good)">Used (Good)</option>
                                                <option value="Used (Fair)">Used (Fair)</option>
                                                <option value="Damaged">Damaged</option>
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Storage Location */}
                                <div className="grid gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-gray-400" /> Storage Location
                                    </label>
                                    <input type="hidden" name="location" value="" /> {/* Legacy location field force empty */}
                                    <StorageLocationSelect
                                        onChange={(val) => {
                                            setStorageLocationId(val);
                                            const input = document.getElementById(`hidden-storage-${ci.AssetID}`) as HTMLInputElement;
                                            if (input) input.value = val;
                                        }}
                                        value={storageLocationId}
                                    />
                                    <input type="hidden" name="storageLocationID" id={`hidden-storage-${ci.AssetID}`} defaultValue={ci.StorageLocationID || ''} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end items-center gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70"
                                >
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
