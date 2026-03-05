
"use client";

import { useState, useEffect } from "react";
import { duplicateModel, deleteModel } from "@/app/actions/models";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Copy, Loader2, Trash2, AlertTriangle, CheckCircle2, UserPlus, Search, Filter, ChevronDown, RefreshCcw, MoreHorizontal, Settings } from "lucide-react";
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
    return { label: 'Stock OK', color: 'bg-green-100 text-green-700 border-green-200', icon: '🟢', tooltip: 'Stock is sufficient' };
}


export default function ModelList({ models, manufacturers }: { models: any[], manufacturers: any[] }) {
    const router = useRouter();
    const [cloningId, setCloningId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [forecastData, setForecastData] = useState<any[]>([]);

    // --- Search & Filter State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterManufacturer, setFilterManufacturer] = useState("All");
    const [filterStatus, setFilterStatus] = useState("All");
    const [filterLocation, setFilterLocation] = useState("All");
    const [showFilters, setShowFilters] = useState(false);

    // --- Actions Dropdown State ---
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!(event.target as Element).closest('.action-dropdown-container')) {
                setOpenDropdownId(null);
            }
        }
        if (openDropdownId) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openDropdownId]);

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

    // --- Derived Data for Filters ---
    const categories = [
        { value: "Laptop", label: "Laptop" },
        { value: "Desktop", label: "Desktop" },
        { value: "Monitor", label: "Monitor" },
        { value: "Printer", label: "Printer" },
        { value: "Consumable", label: "Consumable (Toner/Ink)" },
        { value: "Mobile", label: "Mobile Phone" },
        { value: "Tablet", label: "Tablet" },
        { value: "Accessory", label: "Accessory" },
    ];
    const manufacturerNames = Array.from(new Set(models.map(m => m.Manufacturer?.Name))).filter(Boolean).sort() as string[];
    const storageLocations = Array.from(new Set(models.flatMap(m => m.locations || []))).filter(Boolean).sort() as string[];

    // --- Apply Filters ---
    const filteredModels = models.filter(m => {
        // Text Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = m.Name?.toLowerCase().includes(query);
            const matchesSeries = m.Series?.toLowerCase().includes(query);
            const matchesCategory = m.Category?.toLowerCase().includes(query);
            const matchesManufacturer = m.Manufacturer?.Name?.toLowerCase().includes(query);
            if (!matchesName && !matchesSeries && !matchesCategory && !matchesManufacturer) return false;
        }

        // Category Filter
        if (filterCategory !== "All" && m.Category !== filterCategory) return false;

        // Manufacturer Filter
        if (filterManufacturer !== "All" && m.Manufacturer?.Name !== filterManufacturer) return false;

        // Location Filter
        if (filterLocation !== "All" && !(m.locations || []).includes(filterLocation)) return false;

        // Status Filter
        if (filterStatus === "In Stock" && (m.AvailableStock || 0) <= 0) return false;
        if (filterStatus === "Out of Stock" && (m.AvailableStock || 0) > 0) return false;
        if (filterStatus === "Low Stock" && (m.AvailableStock || 0) > (m.ReorderLevel || 0)) return false;

        return true;
    });

    const activeFilterCount = (filterCategory !== "All" ? 1 : 0) + (filterManufacturer !== "All" ? 1 : 0) + (filterLocation !== "All" ? 1 : 0) + (filterStatus !== "All" ? 1 : 0);

    function clearFilters() {
        setSearchQuery("");
        setFilterCategory("All");
        setFilterManufacturer("All");
        setFilterLocation("All");
        setFilterStatus("All");
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Asset Models</h1>
                    <p className="text-gray-500 mt-1">
                        Define abstract equipment models (e.g. Dell Latitude 5520).
                    </p>
                </div>
                <CreateModelDialog manufacturers={manufacturers} />
            </div>

            {/* ── Search & Filters Bar ── */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search models, category, manufacturer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${showFilters || activeFilterCount > 0
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">
                                    {activeFilterCount}
                                </span>
                            )}
                            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                        </button>

                        {/* Summary */}
                        <div className="text-sm text-gray-500 whitespace-nowrap pl-2 border-l border-gray-200">
                            Showing <span className="font-semibold text-gray-900">{filteredModels.length}</span> of {models.length}
                        </div>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2">
                        {/* Status Filter */}
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Stock Status</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {["All", "In Stock", "Out of Stock", "Low Stock"].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${filterStatus === status
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="All">All Categories</option>
                                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>

                        {/* Manufacturer Filter */}
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Manufacturer</label>
                            <select
                                value={filterManufacturer}
                                onChange={(e) => setFilterManufacturer(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="All">All Manufacturers</option>
                                {manufacturerNames.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        {/* Location Filter */}
                        {storageLocations.length > 0 && (
                            <div className="flex-1 min-w-[150px]">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Storage Location</label>
                                <select
                                    value={filterLocation}
                                    onChange={(e) => setFilterLocation(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="All">All Locations</option>
                                    {storageLocations.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Clear All */}
                        {(searchQuery || activeFilterCount > 0) && (
                            <div className="flex items-end">
                                <button
                                    onClick={clearFilters}
                                    className="h-[38px] px-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="h-12 px-4 align-middle font-medium">Model Name</th>
                            <th className="h-12 px-4 align-middle font-medium">Series</th>
                            <th className="h-12 px-4 align-middle font-medium">Manufacturer</th>
                            <th className="h-12 px-4 align-middle font-medium">Category</th>
                            <th className="h-12 px-4 align-middle font-medium text-center">Stock</th>
                            <th className="h-12 px-4 align-middle font-medium text-center">Status</th>
                            <th className="h-12 px-4 align-middle font-medium">Active Devices</th>
                            <th className="h-12 px-4 align-middle font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {models.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                    No models found. Create one to get started.
                                </td>
                            </tr>
                        ) : filteredModels.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-10 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <Search className="h-8 w-8 text-gray-300" />
                                        <p>No models match your search filters.</p>
                                        <button onClick={clearFilters} className="text-blue-600 hover:underline text-sm font-medium">Clear all filters</button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredModels.map((m) => (
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
                                        <div className="flex flex-col items-center justify-center">
                                            <span className={`text-lg font-bold ${(m.AvailableStock || 0) <= 0 ? "text-red-500" : "text-gray-900"}`}>
                                                {m.AvailableStock || 0}
                                            </span>
                                            <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap mt-0.5">
                                                {m.AssignedStock || 0} in use
                                            </span>
                                        </div>
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
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">
                                                Used by
                                            </span>
                                            <span className="text-xs font-medium text-gray-500">
                                                {m._count.assets} devices
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2 items-center">
                                        {/* Primary Action Button */}
                                        <Link
                                            href={`/assign?modelId=${m.ModelID}`}
                                            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-8 px-4 gap-1.5 min-w-[90px] ${(m.AvailableStock || 0) <= 0
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

                                        {/* Manage Dropdown Menu */}
                                        <div className="relative action-dropdown-container">
                                            <button
                                                onClick={() => setOpenDropdownId(openDropdownId === m.ModelID ? null : m.ModelID)}
                                                className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border shadow-sm h-8 px-3 gap-1.5 ${openDropdownId === m.ModelID
                                                    ? "bg-gray-100 text-gray-900 border-gray-300"
                                                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                                                    }`}
                                            >
                                                <Settings className="h-4 w-4" />
                                                <span>Manage</span>
                                                <ChevronDown className={`h-3 w-3 ml-0.5 transition-transform ${openDropdownId === m.ModelID ? "rotate-180" : ""}`} />
                                            </button>

                                            {/* Dropdown List */}
                                            {openDropdownId === m.ModelID && (
                                                <div className="absolute right-0 mt-1 w-56 rounded-xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                    <div className="p-1 space-y-0.5">
                                                        <AddStockDialog model={m} triggerLabel="Add Stock" variant="dropdown" />
                                                        <AdjustInventoryDialog model={m} triggerLabel="Correct Stock" variant="dropdown" />
                                                        <StockHistoryDialog model={m} triggerLabel="View History" variant="dropdown" />

                                                        <div className="h-px bg-gray-100 my-1 mx-2" />

                                                        <EditModelDialog model={m} manufacturers={manufacturers} triggerLabel="Edit" variant="dropdown" />

                                                        <button
                                                            onClick={() => {
                                                                handleClone(m.ModelID);
                                                                setOpenDropdownId(null);
                                                            }}
                                                            disabled={cloningId === m.ModelID}
                                                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
                                                        >
                                                            {cloningId === m.ModelID ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : <Copy className="h-4 w-4 text-gray-400" />}
                                                            {cloningId === m.ModelID ? "Cloning..." : "Duplicate"}
                                                        </button>

                                                        <div className="h-px bg-gray-100 my-1 mx-2" />

                                                        <button
                                                            onClick={() => {
                                                                handleDelete(m.ModelID, m.Name);
                                                                setOpenDropdownId(null);
                                                            }}
                                                            disabled={deletingId === m.ModelID}
                                                            className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {deletingId === m.ModelID ? <Loader2 className="h-4 w-4 animate-spin text-red-500" /> : <Trash2 className="h-4 w-4 text-red-500" />}
                                                            {deletingId === m.ModelID ? "Deleting..." : "Delete Model"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
