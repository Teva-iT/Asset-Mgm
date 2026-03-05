"use client";

import { useState, useEffect, useMemo } from "react";
import { History, X, Plus, Minus, RefreshCw, Search, Filter, ChevronDown } from "lucide-react";

const ACTION_META: Record<string, { color: string; label: string; icon: any }> = {
    ADD: { icon: Plus, color: "text-green-700 bg-green-50 border-green-200", label: "Purchase" },
    ASSIGN: { icon: Minus, color: "text-blue-700 bg-blue-50 border-blue-200", label: "Assigned" },
    RETURN: { icon: RefreshCw, color: "text-indigo-700 bg-indigo-50 border-indigo-200", label: "Returned" },
    ADJUST: { icon: RefreshCw, color: "text-orange-700 bg-orange-50 border-orange-200", label: "Adjusted" },
};

const ALL_TYPES = ["ADD", "ASSIGN", "RETURN", "ADJUST"];

export default function StockHistoryDialog({ model }: { model: any }) {
    const [open, setOpen] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // ─── Filter state ───────────────────────────────
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState<string[]>([]);
    const [filterLoc, setFilterLoc] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    // ─── Load records ────────────────────────────────
    useEffect(() => {
        if (!open) return;
        setLoading(true);
        fetch(`/api/inventory-history?modelId=${model.ModelID}`)
            .then(r => r.json())
            .then(data => setRecords(Array.isArray(data) ? data : []))
            .catch(() => setRecords([]))
            .finally(() => setLoading(false));
    }, [open, model.ModelID]);

    // ─── Unique locations for dropdown ───────────────
    const locations = useMemo(() => {
        if (!Array.isArray(records)) return [];
        const names = records
            .map(r => r.StorageLocation?.Name)
            .filter(Boolean) as string[];
        return [...new Set(names)].sort();
    }, [records]);

    // ─── Filtered result ─────────────────────────────
    const filtered = useMemo(() => {
        return records.filter(r => {
            const text = `${r.ActionType} ${r.Notes || ""} ${r.StorageLocation?.Name || ""}`.toLowerCase();
            if (search && !text.includes(search.toLowerCase())) return false;
            if (filterType.length && !filterType.includes(r.ActionType)) return false;
            if (filterLoc && r.StorageLocation?.Name !== filterLoc) return false;
            if (fromDate && new Date(r.CreatedAt) < new Date(fromDate)) return false;
            if (toDate && new Date(r.CreatedAt) > new Date(toDate + "T23:59:59")) return false;
            return true;
        });
    }, [records, search, filterType, filterLoc, fromDate, toDate]);

    const activeFilterCount = (filterType.length ? 1 : 0) + (filterLoc ? 1 : 0) + (fromDate || toDate ? 1 : 0);

    function toggleType(t: string) {
        setFilterType(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    }

    function clearAll() {
        setSearch(""); setFilterType([]); setFilterLoc(""); setFromDate(""); setToDate("");
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-gray-50 text-gray-600 hover:bg-gray-100 h-8 px-3"
                title="View Stock History"
            >
                <History className="h-4 w-4 mr-1" />
                History
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[760px] max-h-[88vh] flex flex-col overflow-hidden border border-gray-100">

                        {/* ── Header ── */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/60 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 text-gray-700 rounded-lg"><History className="h-5 w-5" /></div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Stock History</h2>
                                    <p className="text-xs text-gray-500">{model.Manufacturer?.Name} {model.Name}</p>
                                </div>
                            </div>
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* ── Summary bar ── */}
                        <div className="px-6 py-2.5 border-b border-gray-100 flex gap-5 text-xs bg-white flex-shrink-0">
                            <span className="text-gray-500">Total: <strong className="text-gray-900">{model.TotalStock || 0}</strong></span>
                            <span className="text-green-600">Available: <strong>{model.AvailableStock || 0}</strong></span>
                            <span className="text-blue-600">Assigned: <strong>{model.AssignedStock || 0}</strong></span>
                            <span className="ml-auto text-gray-400">{filtered.length} records{records.length !== filtered.length && ` of ${records.length}`}</span>
                        </div>

                        {/* ── Search + Filter bar ── */}
                        <div className="px-6 py-3 border-b border-gray-100 flex gap-2 items-center flex-shrink-0">
                            {/* Search box */}
                            <div className="relative flex-1">
                                <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search type, notes, location..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            {/* Filter toggle */}
                            <button
                                onClick={() => setShowFilters(v => !v)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${activeFilterCount > 0
                                        ? "bg-blue-50 text-blue-700 border-blue-300"
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                <Filter className="h-3.5 w-3.5" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">{activeFilterCount}</span>
                                )}
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                            </button>

                            {/* Clear all */}
                            {(search || activeFilterCount > 0) && (
                                <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 border border-gray-200 rounded-lg">
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* ── Expanded Filter panel ── */}
                        {showFilters && (
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/40 flex flex-wrap gap-6 flex-shrink-0">
                                {/* Type filter */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Type</p>
                                    <div className="flex gap-2">
                                        {ALL_TYPES.map(t => {
                                            const meta = ACTION_META[t];
                                            const active = filterType.includes(t);
                                            return (
                                                <button
                                                    key={t}
                                                    onClick={() => toggleType(t)}
                                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${active ? meta.color + " border-current" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"}`}
                                                >
                                                    {meta.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Location filter */}
                                {locations.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Location</p>
                                        <select
                                            value={filterLoc}
                                            onChange={e => setFilterLoc(e.target.value)}
                                            className="text-sm border border-gray-200 rounded-lg bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        >
                                            <option value="">All Locations</option>
                                            {locations.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Date range */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Date Range</p>
                                    <div className="flex items-center gap-2">
                                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                            className="text-sm border border-gray-200 rounded-lg bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                        <span className="text-gray-400 text-xs">→</span>
                                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                                            className="text-sm border border-gray-200 rounded-lg bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Table ── */}
                        <div className="overflow-y-auto flex-1">
                            {loading ? (
                                <div className="p-10 text-center text-gray-400 text-sm">Loading history...</div>
                            ) : filtered.length === 0 ? (
                                <div className="p-10 text-center text-gray-400 text-sm">
                                    {records.length === 0 ? "No inventory movements recorded yet." : "No records match your filters."}
                                </div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100 sticky top-0">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Type</th>
                                            <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Qty</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Location</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Date</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filtered.map((r: any) => {
                                            const meta = ACTION_META[r.ActionType] || ACTION_META.ADD;
                                            const Icon = meta.icon;
                                            return (
                                                <tr key={r.RecordID} className="hover:bg-gray-50/60 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${meta.color}`}>
                                                            <Icon className="h-3 w-3" />
                                                            {meta.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`font-bold text-sm ${r.Quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                                                            {r.Quantity > 0 ? `+${r.Quantity}` : r.Quantity}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 text-xs">{r.StorageLocation?.Name || "—"}</td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                                        {r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate" title={r.Notes}>{r.Notes || "—"}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
