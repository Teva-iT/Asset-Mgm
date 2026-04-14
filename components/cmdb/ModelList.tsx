"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { duplicateModel, deleteModel, checkModelDependencies } from "@/app/actions/models";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AssetTypeIcon from "@/components/AssetTypeIcon";

import { Copy, Loader2, Trash2, AlertTriangle, UserPlus, Search, Filter, ChevronDown, RefreshCcw, Settings, X, MapPin, FileSpreadsheet, FileText, ExternalLink } from "lucide-react";
import CreateModelDialog from "./CreateModelDialog";
import EditModelDialog from "./EditModelDialog";
import AddStockDialog from "./AddStockDialog";
import AdjustInventoryDialog from "./AdjustInventoryDialog";
import StockHistoryDialog from "./StockHistoryDialog";
import { useModalDismiss } from "@/hooks/useModalDismiss";
import InventoryOrderCalendar from "@/components/inventory/InventoryOrderCalendar";

const TABLE_ACTION_BUTTON_BASE =
    "inline-flex h-8 min-w-[110px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-4 text-sm font-medium shadow-sm transition-colors";
const TABLE_ACTION_BUTTON_SECONDARY =
    `${TABLE_ACTION_BUTTON_BASE} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900`;
const TABLE_ACTION_BUTTON_PRIMARY =
    `${TABLE_ACTION_BUTTON_BASE} bg-blue-600 text-white hover:bg-blue-700`;
const TABLE_ACTION_BUTTON_PRIMARY_DISABLED =
    `${TABLE_ACTION_BUTTON_BASE} cursor-not-allowed border border-gray-300 bg-gray-200 text-gray-500 opacity-60 grayscale shadow-none`;

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

function getInventoryAlert(available: number, reorderLevel: number) {
    if (available <= 0) {
        return {
            severity: "Critical",
            indicator: "🔴 CRITICAL",
            alert: "Out of stock",
            action: "Immediate refill required",
            shortage: Math.max(reorderLevel || 1, 1),
            sortOrder: 0,
        };
    }

    if (reorderLevel > 0 && available <= reorderLevel) {
        return {
            severity: "Warning",
            indicator: "🟠 LOW",
            alert: `Below reorder level (${reorderLevel})`,
            action: "Replenish soon",
            shortage: reorderLevel - available,
            sortOrder: 1,
        };
    }

    if (available < 5) {
        return {
            severity: "Warning",
            indicator: "🟠 LOW",
            alert: "Below minimum safe stock (5)",
            action: "Replenish soon",
            shortage: Math.max(5 - available, 0),
            sortOrder: 1,
        };
    }

    return {
        severity: "Healthy",
        indicator: "🟢 OK",
        alert: "Stock level is healthy",
        action: "No action needed",
        shortage: 0,
        sortOrder: 3,
    };
}

function normalizeFilePart(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function normalizeConsolidationValue(value: unknown) {
    return String(value || "")
        .toLowerCase()
        .replace(/["']/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function canonicalColor(value: unknown) {
    const normalized = normalizeConsolidationValue(value);

    if (normalized === "yellow") return "Yellow";
    if (normalized === "magenta") return "Magenta";
    if (normalized === "cyan") return "Cyan";
    if (normalized === "black") return "Black";

    return String(value || "").trim();
}

function buildConsolidationKey(model: any) {
    const normalizedModelNumber = normalizeConsolidationValue(model.ModelNumber);
    const normalizedName = normalizeConsolidationValue(model.Name);
    const identityPart = normalizedModelNumber || normalizedName;

    return [
        identityPart,
        normalizeConsolidationValue(model.Manufacturer?.Name),
        normalizeConsolidationValue(model.Category),
        normalizeConsolidationValue(canonicalColor(model.Color)),
    ].join("::");
}

function buildModelSummaryKey(model: {
    modelName: string;
    modelNumber: string;
    manufacturer: string;
    category: string;
}) {
    const normalizedModelNumber = normalizeConsolidationValue(model.modelNumber);
    const normalizedName = normalizeConsolidationValue(model.modelName);
    const identityPart = normalizedModelNumber || normalizedName;

    return [
        identityPart,
        normalizeConsolidationValue(model.manufacturer),
        normalizeConsolidationValue(model.category),
    ].join("::");
}

function csvEscape(value: unknown) {
    const stringValue = value == null ? "" : String(value);
    if (/[;"\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

function getRiskColors(riskLevel: string) {
    if (riskLevel === "Critical") {
        return { fill: "FEE2E2", font: "991B1B" };
    }

    if (riskLevel === "Warning") {
        return { fill: "FFEDD5", font: "9A3412" };
    }

    if (riskLevel === "Caution") {
        return { fill: "FEF3C7", font: "92400E" };
    }

    return { fill: "DCFCE7", font: "166534" };
}

function getColorCellStyle(colorValue: string) {
    if (colorValue === "Yellow") {
        return { fill: "FEF08A", font: "854D0E" };
    }

    if (colorValue === "Magenta") {
        return { fill: "F5D0FE", font: "A21CAF" };
    }

    if (colorValue === "Cyan") {
        return { fill: "CFFAFE", font: "0E7490" };
    }

    if (colorValue === "Black") {
        return { fill: "1F2937", font: "FFFFFF" };
    }

    return null;
}

function getColorListFontArgb(colorValue: string) {
    if (colorValue === "Yellow") return "B45309";
    if (colorValue === "Magenta") return "A21CAF";
    if (colorValue === "Cyan") return "0E7490";
    if (colorValue === "Black") return "1F2937";
    return "374151";
}

function formatColorListForExcel(value: unknown) {
    const colors = String(value ?? "")
        .split("|")
        .map((item) => item.trim())
        .filter(Boolean);

    if (colors.length === 0) return null;

    if (colors.length === 1) {
        const color = colors[0];
        return {
            text: color,
            style: { font: getColorListFontArgb(color) },
        };
    }

    return {
        richText: colors.flatMap((color, index) => {
            const segments: any[] = [
                {
                    text: color,
                    font: {
                        bold: true,
                        color: { argb: getColorListFontArgb(color) },
                    },
                },
            ];

            if (index < colors.length - 1) {
                segments.push({
                    text: "  |  ",
                    font: { color: { argb: "6B7280" } },
                });
            }

            return segments;
        }),
    };
}

function findHeaderColumn(row: any, headerLabel: string) {
    const headerRow = row.worksheet?.getRow(1);
    if (!headerRow) return null;

    for (let columnNumber = 1; columnNumber <= headerRow.cellCount; columnNumber += 1) {
        if (String(headerRow.getCell(columnNumber).value ?? "").trim() === headerLabel) {
            return columnNumber;
        }
    }

    return null;
}

function formatWarehouseBreakdown(locationStocks: Map<string, number>) {
    return Array.from(locationStocks.entries())
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([location, quantity]) => `${location}: ${quantity}`)
        .join(" | ");
}

function formatWarehouseRows(locationStocks: Map<string, number>, limit: number = 2) {
    return Array.from(locationStocks.entries())
        .sort((left, right) => left[0].localeCompare(right[0]))
        .map(([location, quantity]) => ({ location, quantity }))
        .slice(0, limit);
}

function formatWarehouseEntries(locationStocks: Map<string, number>) {
    return Array.from(locationStocks.entries())
        .sort((left, right) => {
            const quantityDiff = (right[1] || 0) - (left[1] || 0);
            if (quantityDiff !== 0) return quantityDiff;
            return left[0].localeCompare(right[0]);
        })
        .map(([location, quantity]) => ({ location, quantity }));
}

function getOverviewColorBadgeClasses(color: string, active: boolean) {
    const normalized = color.toLowerCase();

    if (normalized === "black") {
        return active
            ? "border-gray-900 bg-gray-900 text-white shadow-sm"
            : "border-gray-300 bg-white text-gray-700 hover:border-gray-500";
    }

    if (normalized === "yellow") {
        return active
            ? "border-yellow-400 bg-yellow-100 text-yellow-900 shadow-sm"
            : "border-yellow-200 bg-white text-yellow-800 hover:border-yellow-300";
    }

    if (normalized === "magenta") {
        return active
            ? "border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700 shadow-sm"
            : "border-fuchsia-200 bg-white text-fuchsia-700 hover:border-fuchsia-300";
    }

    if (normalized === "cyan") {
        return active
            ? "border-cyan-400 bg-cyan-50 text-cyan-700 shadow-sm"
            : "border-cyan-200 bg-white text-cyan-700 hover:border-cyan-300";
    }

    return active
        ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm"
        : "border-gray-200 bg-white text-gray-700 hover:border-blue-300";
}

function getOverviewColorDotClass(color: string) {
    const normalized = color.toLowerCase();
    if (normalized === "black") return "bg-gray-900";
    if (normalized === "yellow") return "bg-yellow-400";
    if (normalized === "magenta") return "bg-fuchsia-500";
    if (normalized === "cyan") return "bg-cyan-400";
    return "bg-blue-400";
}

function getColumnWidth(rows: Record<string, unknown>[], header: string) {
    const longestValue = Math.max(
        header.length,
        ...rows.map((row) => String(row[header] ?? "").length)
    );

    return Math.min(Math.max(longestValue + 2, 12), 36);
}

function styleHeaderRow(row: any) {
    row.eachCell((cell: any) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1D4ED8" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
            top: { style: "thin", color: { argb: "BFDBFE" } },
            left: { style: "thin", color: { argb: "BFDBFE" } },
            bottom: { style: "thin", color: { argb: "BFDBFE" } },
            right: { style: "thin", color: { argb: "BFDBFE" } },
        };
    });
}

function styleDataRow(row: any, riskLevel: string) {
    const colors = getRiskColors(riskLevel);
    const colorColumn = findHeaderColumn(row, "Color");
    const colorsColumn = findHeaderColumn(row, "Colors");
    const affectedColorsColumn = findHeaderColumn(row, "Affected Colors");
    const inventoryAlertColumn = findHeaderColumn(row, "Inventory Alert");
    const riskLevelColumn = findHeaderColumn(row, "Risk Level");
    const priorityRankColumn = findHeaderColumn(row, "Priority Rank");
    const alertDetailsColumn = findHeaderColumn(row, "Alert Details");

    row.eachCell((cell: any) => {
        cell.border = {
            bottom: { style: "thin", color: { argb: "E5E7EB" } },
        };
    });

    [inventoryAlertColumn, riskLevelColumn, priorityRankColumn, alertDetailsColumn]
        .filter((columnNumber): columnNumber is number => Boolean(columnNumber))
        .forEach((columnNumber, index) => {
            const cell = row.getCell(columnNumber);
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.fill } };
            cell.font = { ...(index < 2 ? { bold: true } : {}), color: { argb: colors.font } };
        });

    if (colorColumn) {
        const colorStyle = getColorCellStyle(String(row.getCell(colorColumn).value ?? ""));
        if (colorStyle) {
            const colorCell = row.getCell(colorColumn);
            colorCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colorStyle.fill } };
            colorCell.font = { bold: true, color: { argb: colorStyle.font } };
            colorCell.alignment = { vertical: "middle", horizontal: "center" };
        }
    }

    [colorsColumn, affectedColorsColumn]
        .filter((columnNumber): columnNumber is number => Boolean(columnNumber))
        .forEach((columnNumber) => {
            const colorListCell = row.getCell(columnNumber);
            const formatted = formatColorListForExcel(colorListCell.value);

            if (!formatted) return;

            if ("richText" in formatted) {
                colorListCell.value = { richText: formatted.richText };
                colorListCell.alignment = { vertical: "middle" };
                return;
            }

            colorListCell.value = formatted.text;
            if (formatted.style) {
                colorListCell.font = { bold: true, color: { argb: formatted.style.font } };
                colorListCell.alignment = { vertical: "middle" };
            }
        });
}

function styleAlertSheetRow(row: any, riskLevel: string) {
    const colors = getRiskColors(riskLevel);
    const riskLevelColumn = findHeaderColumn(row, "Risk Level");
    const inventoryAlertColumn = findHeaderColumn(row, "Inventory Alert");
    const colorColumn = findHeaderColumn(row, "Color");
    const colorsColumn = findHeaderColumn(row, "Colors");
    const affectedColorsColumn = findHeaderColumn(row, "Affected Colors");

    row.eachCell((cell: any) => {
        cell.border = { bottom: { style: "thin", color: { argb: "E5E7EB" } } };
    });

    [inventoryAlertColumn, riskLevelColumn]
        .filter((columnNumber): columnNumber is number => Boolean(columnNumber))
        .forEach((columnNumber) => {
            const cell = row.getCell(columnNumber);
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.fill } };
            cell.font = { bold: true, color: { argb: colors.font } };
        });

    if (colorColumn) {
        const colorCell = row.getCell(colorColumn);
        const style = getColorCellStyle(String(colorCell.value ?? ""));
        if (style) {
            colorCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: style.fill } };
            colorCell.font = { bold: true, color: { argb: style.font } };
            colorCell.alignment = { vertical: "middle", horizontal: "center" };
        }
    }

    [colorsColumn, affectedColorsColumn]
        .filter((columnNumber): columnNumber is number => Boolean(columnNumber))
        .forEach((columnNumber) => {
            const colorListCell = row.getCell(columnNumber);
            const formatted = formatColorListForExcel(colorListCell.value);

            if (!formatted) return;

            if ("richText" in formatted) {
                colorListCell.value = { richText: formatted.richText };
                colorListCell.alignment = { vertical: "middle" };
                return;
            }

            colorListCell.value = formatted.text;
            if (formatted.style) {
                colorListCell.font = { bold: true, color: { argb: formatted.style.font } };
                colorListCell.alignment = { vertical: "middle" };
            }
        });
}

function styleSummaryValueCell(cell: any, riskLevel: string) {
    const colors = getRiskColors(riskLevel);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.fill } };
    cell.font = { bold: true, color: { argb: colors.font }, size: 16 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
}

function normalizeFilterValue(value: string | null | undefined) {
    return String(value ?? "").trim().toLowerCase();
}

function matchesSelectedValues(selectedValues: string[], candidate: string | null | undefined) {
    if (selectedValues.length === 0) return true;
    const normalizedCandidate = normalizeFilterValue(candidate);
    if (!normalizedCandidate) return false;
    const normalizedSet = new Set(selectedValues.map((value) => normalizeFilterValue(value)));
    return normalizedSet.has(normalizedCandidate);
}

function summarizeSelections(selectedValues: string[], options: { value: string; label: string }[], fallbackLabel: string) {
    if (selectedValues.length === 0) return fallbackLabel;

    const selectedLabels = options
        .filter((option) => selectedValues.includes(option.value))
        .map((option) => option.label);

    if (selectedLabels.length === 1) return selectedLabels[0];
    if (selectedLabels.length === 2) return selectedLabels.join(", ");

    return `${selectedLabels[0]} +${selectedLabels.length - 1}`;
}

function getLastIntakeBadge(actionType: string | null | undefined) {
    if (actionType === "OPENING_STOCK") {
        return {
            label: "Opening Stock",
            className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
    }

    if (actionType === "ADD") {
        return {
            label: "Purchase",
            className: "bg-green-50 text-green-700 border-green-200",
        };
    }

    return null;
}

function MultiSelectFilter({
    label,
    options,
    selectedValues,
    onChange,
    allLabel,
}: {
    label: string;
    options: { value: string; label: string; iconType?: string }[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    allLabel: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(query.trim().toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const timeoutId = window.setTimeout(() => searchInputRef.current?.focus(), 0);
        return () => window.clearTimeout(timeoutId);
    }, [open]);

    function toggleValue(value: string) {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter((item) => item !== value));
            return;
        }

        onChange([...selectedValues, value]);
    }

    const summary = summarizeSelections(selectedValues, options, allLabel);

    return (
        <div ref={containerRef} className="relative flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
            <button
                type="button"
                onClick={() => {
                    if (open) {
                        setOpen(false);
                        setQuery("");
                        return;
                    }

                    setQuery("");
                    setOpen(true);
                }}
                className={`w-full border rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition flex items-center justify-between gap-3 ${open ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-200"}`}
            >
                <span className={`truncate text-left ${selectedValues.length > 0 ? "text-gray-900" : "text-gray-500"}`}>
                    {summary}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                    {selectedValues.length > 0 && (
                        <span className="inline-flex min-w-5 justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {selectedValues.length}
                        </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
            </button>

            {open && (
                <div className="absolute z-30 mt-2 w-full min-w-[220px] rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                        <button
                            type="button"
                            onClick={() => onChange(options.map((option) => option.value))}
                            className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                            Select all
                        </button>
                        <button
                            type="button"
                            onClick={() => onChange([])}
                            className="text-xs font-medium text-gray-500 hover:text-gray-800"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="border-b border-gray-100 p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder={`Search ${label.toLowerCase()}...`}
                                className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                        {filteredOptions.map((option) => {
                            const checked = selectedValues.includes(option.value);

                            return (
                                <label
                                    key={option.value}
                                    className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleValue(option.value)}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    {option.iconType && <AssetTypeIcon type={option.iconType} className="h-4 w-4 text-gray-500" />}
                                    <span className="truncate">{option.label}</span>
                                </label>
                            );
                        })}
                        {filteredOptions.length === 0 && (
                            <div className="px-3 py-3 text-sm text-gray-400">No {label.toLowerCase()} found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


export default function ModelList({ models, manufacturers, locations = [] }: { models: any[], manufacturers: any[], locations?: any[] }) {
    const router = useRouter();
    const [cloningId, setCloningId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{ id: string, name: string, assetsCount: number } | null>(null);
    const [isCheckingDeps, setIsCheckingDeps] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [forecastData, setForecastData] = useState<any[]>([]);

    // --- Search & Filter State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategories, setFilterCategories] = useState<string[]>([]);
    const [filterManufacturers, setFilterManufacturers] = useState<string[]>([]);
    const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
    const [filterLocations, setFilterLocations] = useState<string[]>([]);
    const [filterColors, setFilterColors] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);
    const [assetTypes, setAssetTypes] = useState<{ Name: string }[]>([]);
    const [selectedOverviewColor, setSelectedOverviewColor] = useState<string | null>("__all__");

    // --- Actions Dropdown State ---
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // --- Series Details State ---
    const [viewSeriesId, setViewSeriesId] = useState<string | null>(null);

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

        fetch("/api/asset-types")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setAssetTypes(data);
            })
            .catch((err) => console.error("Failed to fetch asset types:", err));
    }, []);

    function handleClone(modelId: string) {
        setCloningId(modelId);
        startTransition(async () => {
            const res = await duplicateModel(modelId);
            if (res.success) {
                router.refresh();
            } else {
                alert("Failed to clone model");
            }
            setCloningId(null);
        });
    }

    function handleDeleteClick(modelId: string, modelName: string) {
        setIsCheckingDeps(true);
        setOpenDropdownId(null);

        startTransition(async () => {
            try {
                const res = await checkModelDependencies(modelId);
                if (res.success) {
                    setDeleteConfirmInfo({ id: modelId, name: modelName, assetsCount: res.count as number });
                } else {
                    alert("Failed to check dependencies.");
                }
            } catch (err) {
                alert("Failed to check dependencies due to a server error.");
            } finally {
                setIsCheckingDeps(false);
            }
        });
    }

    function handleConfirmDelete(force: boolean = false) {
        if (!deleteConfirmInfo) return;

        const { id, name } = deleteConfirmInfo;
        setDeletingId(id);

        startTransition(async () => {
            try {
                const res = await deleteModel(id, force);
                if (res.success) {
                    setDeleteConfirmInfo(null);
                    router.refresh();
                } else {
                    alert(res.error || "Failed to delete model.");
                }
            } catch (err) {
                alert("Failed to delete model due to a server error.");
            } finally {
                setDeletingId(null);
            }
        });
    }

    // --- Derived Data for Filters ---
    const categories = Array.from(
        new Set([
            ...assetTypes.map((type) => type.Name).filter(Boolean),
            ...models.map((model) => model.Category).filter(Boolean),
        ])
    )
        .sort((left, right) => String(left).localeCompare(String(right)))
        .map((name) => ({
            value: name as string,
            label: name as string,
            iconType: name as string,
        }));
    const statusOptions = [
        { value: "In Stock", label: "In Stock" },
        { value: "Out of Stock", label: "Out of Stock" },
        { value: "Low Stock", label: "Low Stock" },
    ];
    const manufacturerOptions = Array.from(new Set(models.map(m => m.Manufacturer?.Name))).filter(Boolean).sort().map((name) => ({ value: name as string, label: name as string }));
    const storageLocationOptions = Array.from(new Set(locations.map(l => l.Name))).filter(Boolean).sort().map((name) => ({ value: name as string, label: name as string }));
    const colorOptions = Array.from(new Set(models.map((m) => m.Color))).filter(Boolean).sort().map((color) => ({ value: color as string, label: color as string }));

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
        if (!matchesSelectedValues(filterCategories, m.Category)) return false;

        // Manufacturer Filter
        if (!matchesSelectedValues(filterManufacturers, m.Manufacturer?.Name)) return false;

        // Location Filter
        if (!matchesSelectedValues(filterLocations, m.DefaultLocationName)) return false;

        // Status Filter
        if (filterStatuses.length > 0) {
            const available = m.AvailableStock || 0;
            const reorderLevel = m.ReorderLevel || 0;
            const modelStatuses: string[] = [];

            if (available > 0) modelStatuses.push("In Stock");
            if (available <= 0) modelStatuses.push("Out of Stock");
            if (reorderLevel > 0 && available <= reorderLevel) modelStatuses.push("Low Stock");

            if (!filterStatuses.some((status) => modelStatuses.includes(status))) return false;
        }

        // Color Filter
        if (!matchesSelectedValues(filterColors, m.Color)) return false;

        return true;
    });

    const totalAvailable = filteredModels.reduce((sum, m) => sum + (m.AvailableStock || 0), 0);
    const totalAssigned = filteredModels.reduce((sum, m) => sum + (m.AssignedStock || 0), 0);
    const totalStock = totalAvailable + totalAssigned;
    const uniqueModelNameCount = new Set(
        filteredModels
            .map((model) => normalizeConsolidationValue(model.Name))
            .filter(Boolean)
    ).size;

    const activeFilterCount = filterCategories.length + filterManufacturers.length + filterLocations.length + filterStatuses.length + filterColors.length;
    const shouldShowWarehouseOverview = searchQuery.trim().length > 0 || activeFilterCount > 0;

    const consolidatedModels = Array.from(
        filteredModels.reduce((groups, model) => {
            const consolidationKey = buildConsolidationKey(model);

            const existing = groups.get(consolidationKey);
            const modelLocations = [
                model.DefaultLocationName,
                ...(model.locations || []),
            ].filter(Boolean) as string[];
            const stockLocation = model.DefaultLocationName || modelLocations[0] || "Unassigned";

            if (existing) {
                existing.availableStock += model.AvailableStock || 0;
                existing.assignedStock += model.AssignedStock || 0;
                existing.reorderLevel = Math.max(existing.reorderLevel, model.ReorderLevel || 0);
                existing.activeDevices += model._count?.assets || 0;
                modelLocations.forEach((location) => existing.locations.add(location));
                existing.locationStocks.set(stockLocation, (existing.locationStocks.get(stockLocation) || 0) + (model.AvailableStock || 0));
                if (model.Series) existing.series.add(model.Series);
                if (model.Status) existing.conditions.add(model.Status);
                existing.sourceModels += 1;
                return groups;
            }

            groups.set(consolidationKey, {
                modelId: model.ModelID,
                modelName: model.Name || "",
                modelNumber: model.ModelNumber || "",
                series: new Set(model.Series ? [model.Series] : []),
                manufacturer: model.Manufacturer?.Name || "",
                category: model.Category || "",
                color: canonicalColor(model.Color),
                availableStock: model.AvailableStock || 0,
                assignedStock: model.AssignedStock || 0,
                reorderLevel: model.ReorderLevel || 0,
                activeDevices: model._count?.assets || 0,
                locations: new Set(modelLocations),
                locationStocks: new Map([[stockLocation, model.AvailableStock || 0]]),
                conditions: new Set(model.Status ? [model.Status] : []),
                sourceModels: 1,
            });

            return groups;
        }, new Map<string, {
            modelId: string;
            modelName: string;
            modelNumber: string;
            series: Set<string>;
            manufacturer: string;
            category: string;
            color: string;
            availableStock: number;
            assignedStock: number;
            reorderLevel: number;
            activeDevices: number;
            locations: Set<string>;
            locationStocks: Map<string, number>;
            conditions: Set<string>;
            sourceModels: number;
        }>())
    ).map(([, group]) => group);

    const exportRows = consolidatedModels.map((group) => {
        const stockStatus = getStockStatus(group.availableStock, group.reorderLevel);
        const inventoryAlert = getInventoryAlert(group.availableStock, group.reorderLevel);

        return {
            "Model Name": group.modelName,
            "Series": Array.from(group.series).sort().join(" | "),
            "Manufacturer": group.manufacturer,
            "Category": group.category,
            "Color": canonicalColor(group.color),
            "Location": Array.from(group.locations).sort().join(" | "),
            "Inventory Alert": inventoryAlert.indicator,
            "Risk Level": inventoryAlert.severity,
            "Priority Rank": inventoryAlert.sortOrder + 1,
            "Alert Details": inventoryAlert.alert,
            "Recommended Action": inventoryAlert.action,
            "Available Stock": group.availableStock,
            "Assigned Stock": group.assignedStock,
            "Total Stock": group.availableStock + group.assignedStock,
            "Reorder Level": group.reorderLevel,
            "Shortage To Target": inventoryAlert.shortage,
            "Stock Status": stockStatus.label,
            "Condition": Array.from(group.conditions).sort().join(" | "),
            "Active Devices": group.activeDevices,
            "Consolidated Warehouses": group.locations.size,
        };
    });

    const modelSummaryRows = consolidatedModels.map((group) => {
        const inventoryAlert = getInventoryAlert(group.availableStock, group.reorderLevel);
        const stockStatus = getStockStatus(group.availableStock, group.reorderLevel);

        return {
            "Model Name": group.modelName,
            "Series": Array.from(group.series).sort().join(" | "),
            "Manufacturer": group.manufacturer,
            "Category": group.category,
            "Color": canonicalColor(group.color),
            "Warehouse Breakdown": formatWarehouseBreakdown(group.locationStocks),
            "Consolidated Amount": group.availableStock,
            "Location": Array.from(group.locations).sort().join(" | "),
            "Inventory Alert": inventoryAlert.indicator,
            "Risk Level": inventoryAlert.severity,
            "Alert Details": inventoryAlert.alert,
            "Recommended Action": inventoryAlert.action,
            "Shortage To Target": inventoryAlert.shortage,
            "Stock Status": stockStatus.label,
            "Condition": Array.from(group.conditions).sort().join(" | "),
            "Consolidated Warehouses": group.locations.size,
        };
    });

    const severityPriority = { Critical: 0, Warning: 1, Caution: 2, Healthy: 3 } as const;

    const alertRows = exportRows
        .filter((row) => row["Risk Level"] !== "Healthy")
        .sort((left, right) => {
            const severityDiff = severityPriority[left["Risk Level"] as keyof typeof severityPriority] - severityPriority[right["Risk Level"] as keyof typeof severityPriority];
            if (severityDiff !== 0) return severityDiff;

            return Number(right["Shortage To Target"] || 0) - Number(left["Shortage To Target"] || 0);
        });

    const sortedExportRows = [...exportRows].sort((left, right) => {
        const severityDiff = severityPriority[left["Risk Level"] as keyof typeof severityPriority] - severityPriority[right["Risk Level"] as keyof typeof severityPriority];
        if (severityDiff !== 0) return severityDiff;

        return Number(right["Shortage To Target"] || 0) - Number(left["Shortage To Target"] || 0);
    });

    const modelSummaryAlertRows = modelSummaryRows
        .filter((row) => row["Risk Level"] !== "Healthy")
        .sort((left, right) => {
            const severityDiff = severityPriority[left["Risk Level"] as keyof typeof severityPriority] - severityPriority[right["Risk Level"] as keyof typeof severityPriority];
            if (severityDiff !== 0) return severityDiff;

            return Number(right["Shortage To Target"] || 0) - Number(left["Shortage To Target"] || 0);
        });

    const sortedModelSummaryRows = [...modelSummaryRows].sort((left, right) => {
        const severityDiff = severityPriority[left["Risk Level"] as keyof typeof severityPriority] - severityPriority[right["Risk Level"] as keyof typeof severityPriority];
        if (severityDiff !== 0) return severityDiff;

        return Number(right["Shortage To Target"] || 0) - Number(left["Shortage To Target"] || 0);
    });
    const warehouseOverviewGroups = Array.from(
        consolidatedModels.reduce((groups, group) => {
            const summaryKey = buildModelSummaryKey(group);
            const existing = groups.get(summaryKey);

            if (existing) {
                existing.availableStock += group.availableStock;
                existing.assignedStock += group.assignedStock;
                existing.activeDevices += group.activeDevices;
                existing.reorderLevel = Math.max(existing.reorderLevel, group.reorderLevel);
                existing.sourceModels += group.sourceModels;
                if (group.modelId && !existing.modelId) existing.modelId = group.modelId;
                Array.from(group.series).forEach((series) => existing.series.add(series));
                Array.from(group.conditions).forEach((condition) => existing.conditions.add(condition));
                if (group.color) existing.colors.add(group.color);
                if (group.color) {
                    const colorSummary = existing.colorSummaries.get(group.color) || {
                        availableStock: 0,
                        assignedStock: 0,
                        locationStocks: new Map<string, number>(),
                    };
                    colorSummary.availableStock += group.availableStock;
                    colorSummary.assignedStock += group.assignedStock;
                    group.locationStocks.forEach((quantity, location) => {
                        colorSummary.locationStocks.set(location, (colorSummary.locationStocks.get(location) || 0) + quantity);
                    });
                    existing.colorSummaries.set(group.color, colorSummary);
                }
                group.locationStocks.forEach((quantity, location) => {
                    existing.locationStocks.set(location, (existing.locationStocks.get(location) || 0) + quantity);
                });
                return groups;
            }

            groups.set(summaryKey, {
                modelId: group.modelId,
                modelName: group.modelName,
                modelNumber: group.modelNumber,
                manufacturer: group.manufacturer,
                category: group.category,
                availableStock: group.availableStock,
                assignedStock: group.assignedStock,
                reorderLevel: group.reorderLevel,
                activeDevices: group.activeDevices,
                sourceModels: group.sourceModels,
                series: new Set(group.series),
                conditions: new Set(group.conditions),
                colors: new Set(group.color ? [group.color] : []),
                colorSummaries: new Map(group.color ? [[group.color, {
                    availableStock: group.availableStock,
                    assignedStock: group.assignedStock,
                    locationStocks: new Map(group.locationStocks),
                }]] : []),
                locationStocks: new Map(group.locationStocks),
            });

            return groups;
        }, new Map<string, {
            modelId: string;
            modelName: string;
            modelNumber: string;
            manufacturer: string;
            category: string;
            availableStock: number;
            assignedStock: number;
            reorderLevel: number;
            activeDevices: number;
            sourceModels: number;
            series: Set<string>;
            conditions: Set<string>;
            colors: Set<string>;
            colorSummaries: Map<string, {
                availableStock: number;
                assignedStock: number;
                locationStocks: Map<string, number>;
            }>;
            locationStocks: Map<string, number>;
        }>())
    ).map(([, group]) => group);

    const singleWarehouseOverviewGroup = warehouseOverviewGroups.length === 1 ? warehouseOverviewGroups[0] : null;
    const warehouseOverviewModels = warehouseOverviewGroups.slice(0, 6);
    const activeSingleOverviewColor = singleWarehouseOverviewGroup
        ? (selectedOverviewColor === "__all__"
            ? "__all__"
            : (selectedOverviewColor && singleWarehouseOverviewGroup.colorSummaries.has(selectedOverviewColor)
                ? selectedOverviewColor
                : "__all__"))
        : null;
    const activeSingleOverviewColorSummary = singleWarehouseOverviewGroup
        ? (activeSingleOverviewColor === "__all__"
            ? {
                availableStock: singleWarehouseOverviewGroup.availableStock,
                assignedStock: singleWarehouseOverviewGroup.assignedStock,
                locationStocks: singleWarehouseOverviewGroup.locationStocks,
            }
            : (activeSingleOverviewColor
                ? singleWarehouseOverviewGroup.colorSummaries.get(activeSingleOverviewColor) || null
                : null))
        : null;
    const activeSingleOverviewWarehouseEntries = formatWarehouseEntries(
        activeSingleOverviewColorSummary?.locationStocks || singleWarehouseOverviewGroup?.locationStocks || new Map<string, number>()
    );

    useEffect(() => {
        if (!singleWarehouseOverviewGroup) {
            setSelectedOverviewColor(null);
            return;
        }

        const availableColors = Array.from(singleWarehouseOverviewGroup.colorSummaries.keys());
        if (availableColors.length === 0) {
            setSelectedOverviewColor(null);
            return;
        }

        if (selectedOverviewColor === "__all__") {
            return;
        }

        if (!selectedOverviewColor || !singleWarehouseOverviewGroup.colorSummaries.has(selectedOverviewColor)) {
            setSelectedOverviewColor("__all__");
        }
    }, [singleWarehouseOverviewGroup, selectedOverviewColor]);

    function buildExportFileName(extension: "csv" | "xlsx", variant?: string) {
        const parts = ["asset-models"];

        if (filterCategories.length === 1) parts.push(normalizeFilePart(filterCategories[0]));
        if (filterCategories.length > 1) parts.push("multi-category");
        if (filterManufacturers.length === 1) parts.push(normalizeFilePart(filterManufacturers[0]));
        if (filterManufacturers.length > 1) parts.push("multi-manufacturer");
        if (filterLocations.length === 1) parts.push(normalizeFilePart(filterLocations[0]));
        if (filterLocations.length > 1) parts.push("multi-location");
        if (filterStatuses.length === 1) parts.push(normalizeFilePart(filterStatuses[0]));
        if (filterStatuses.length > 1) parts.push("multi-status");
        if (filterColors.length === 1) parts.push(normalizeFilePart(filterColors[0]));
        if (filterColors.length > 1) parts.push("multi-color");
        if (searchQuery.trim()) parts.push("filtered");
        if (variant) parts.push(normalizeFilePart(variant));

        return `${parts.join("-") || "asset-models"}.${extension}`;
    }

    function buildWorkbookSummaryRows(rows: Record<string, unknown>[]) {
        return [
            {
                "Summary Item": "Critical items",
                Count: rows.filter((row) => row["Risk Level"] === "Critical").length,
                Risk: "Critical",
                Notes: "Out of stock and immediate refill needed",
            },
            {
                "Summary Item": "Warning items",
                Count: rows.filter((row) => row["Risk Level"] === "Warning").length,
                Risk: "Warning",
                Notes: "At or below reorder level",
            },
            {
                "Summary Item": "Caution items",
                Count: rows.filter((row) => row["Risk Level"] === "Caution").length,
                Risk: "Caution",
                Notes: "Low reserve stock without a reorder level",
            },
            {
                "Summary Item": "Healthy items",
                Count: rows.filter((row) => row["Risk Level"] === "Healthy").length,
                Risk: "Healthy",
                Notes: "No immediate inventory risk",
            },
        ];
    }

    function exportStyledExcel(
        rows: Record<string, unknown>[],
        alertSheetRows: Record<string, unknown>[],
        fileVariant?: string,
        modelsSheetName: string = "Models"
    ) {
        if (rows.length === 0) {
            alert("No filtered models available to export.");
            return;
        }

        const summaryRows = buildWorkbookSummaryRows(rows);

        void (async () => {
            const ExcelJS = (await import("exceljs")).default;
            const workbook = new ExcelJS.Workbook();
            workbook.creator = "Asset Manager";
            workbook.created = new Date();

            const summarySheet = workbook.addWorksheet("Summary", {
                views: [{ state: "frozen", ySplit: 1 }],
            });
            const alertsSheet = workbook.addWorksheet("Alerts", {
                views: [{ state: "frozen", ySplit: 1 }],
            });
            const modelsSheet = workbook.addWorksheet(modelsSheetName, {
                views: [{ state: "frozen", ySplit: 1 }],
            });

            summarySheet.columns = [
                { header: "Summary Item", key: "Summary Item", width: 24 },
                { header: "Count", key: "Count", width: 14 },
                { header: "Risk", key: "Risk", width: 14 },
                { header: "Notes", key: "Notes", width: 40 },
            ];
            alertsSheet.columns = Object.keys(alertSheetRows[0] || {
                "Inventory Alert": "",
                "Risk Level": "",
                "Priority Rank": "",
                "Alert Details": "",
                "Recommended Action": "",
            }).map((header) => ({ header, key: header, width: getColumnWidth(alertSheetRows.length > 0 ? alertSheetRows : [{
                "Inventory Alert": "🟢 OK",
                "Risk Level": "Healthy",
                "Priority Rank": 4,
                "Alert Details": "No low-stock or out-of-stock items in this export",
                "Recommended Action": "No action needed",
            }], header) }));
            modelsSheet.columns = Object.keys(rows[0]).map((header) => ({
                header,
                key: header,
                width: getColumnWidth(rows, header),
            }));

            styleHeaderRow(summarySheet.getRow(1));
            styleHeaderRow(alertsSheet.getRow(1));
            styleHeaderRow(modelsSheet.getRow(1));

            summaryRows.forEach((row) => {
                const addedRow = summarySheet.addRow(row);
                styleSummaryValueCell(addedRow.getCell("B"), row.Risk);
                addedRow.getCell("C").fill = { type: "pattern", pattern: "solid", fgColor: { argb: getRiskColors(row.Risk).fill } };
                addedRow.getCell("C").font = { bold: true, color: { argb: getRiskColors(row.Risk).font } };
            });

            const effectiveAlertRows = alertSheetRows.length > 0 ? alertSheetRows : [{
                "Inventory Alert": "🟢 OK",
                "Risk Level": "Healthy",
                "Priority Rank": 4,
                "Alert Details": "No low-stock or out-of-stock items in this export",
                "Recommended Action": "No action needed",
            }];

            effectiveAlertRows.forEach((row) => {
                const addedRow = alertsSheet.addRow(row);
                const riskLevel = String(row["Risk Level"] ?? "Healthy");
                styleAlertSheetRow(addedRow, riskLevel);
            });

            rows.forEach((row) => {
                const addedRow = modelsSheet.addRow(row);
                styleDataRow(addedRow, String(row["Risk Level"] ?? "Healthy"));
            });

            summarySheet.autoFilter = "A1:D1";
            alertsSheet.autoFilter = {
                from: { row: 1, column: 1 },
                to: { row: 1, column: alertsSheet.columnCount },
            };
            modelsSheet.autoFilter = {
                from: { row: 1, column: 1 },
                to: { row: 1, column: modelsSheet.columnCount },
            };

            summarySheet.insertRows(1, [
                ["Inventory Export Dashboard"],
                [`Generated: ${new Date().toLocaleString()}`],
                [],
            ]);
            summarySheet.mergeCells("A1:D1");
            summarySheet.mergeCells("A2:D2");
            summarySheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "0F172A" } };
            summarySheet.getCell("A2").font = { italic: true, color: { argb: "475569" } };
            summarySheet.getCell("A1").alignment = { horizontal: "left" };
            summarySheet.getCell("A2").alignment = { horizontal: "left" };
            styleHeaderRow(summarySheet.getRow(4));
            summarySheet.views = [{ state: "frozen", ySplit: 4 }];

            const totalShortage = rows.reduce((sum, row) => sum + Number(row["Shortage To Target"] || 0), 0);
            summarySheet.addRow([]);
            summarySheet.addRow({ "Summary Item": "Total shortage to target", Count: totalShortage, Risk: "Warning", Notes: "Units required to bring risky items back to target" });
            const shortageRow = summarySheet.lastRow;
            if (shortageRow) {
                styleSummaryValueCell(shortageRow.getCell("B"), "Warning");
                shortageRow.getCell("C").fill = { type: "pattern", pattern: "solid", fgColor: { argb: getRiskColors("Warning").fill } };
                shortageRow.getCell("C").font = { bold: true, color: { argb: getRiskColors("Warning").font } };
            }

            const arrayBuffer = await workbook.xlsx.writeBuffer();
            downloadBlob(
                new Blob([arrayBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
                buildExportFileName("xlsx", fileVariant)
            );
        })().catch((error) => {
            console.error("Excel export failed:", error);
            alert("Failed to generate styled Excel export.");
        });
    }

    function downloadBlob(blob: Blob, fileName: string) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function exportAsCsv() {
        if (exportRows.length === 0) {
            alert("No filtered models available to export.");
            return;
        }

        const headers = Object.keys(exportRows[0]);
        const csvLines = [
            "sep=;",
            headers.map(csvEscape).join(";"),
            ...exportRows.map((row) => headers.map((header) => csvEscape(row[header as keyof typeof row])).join(";")),
        ];

        downloadBlob(
            new Blob([`\uFEFF${csvLines.join("\r\n")}`], { type: "text/csv;charset=utf-8;" }),
            buildExportFileName("csv")
        );
    }

    function exportAsExcel() {
        exportStyledExcel(sortedExportRows, alertRows, "by-color");
    }

    function exportAsModelSummaryExcel() {
        exportStyledExcel(sortedModelSummaryRows, modelSummaryAlertRows, "by-model", "Model Colors");
    }

    function clearFilters() {
        setSearchQuery("");
        setFilterCategories([]);
        setFilterManufacturers([]);
        setFilterLocations([]);
        setFilterStatuses([]);
        setFilterColors([]);
    }

    function handleModelCreated(payload: { category: string; name: string }) {
        setSearchQuery("");
        setFilterManufacturers([]);
        setFilterLocations([]);
        setFilterStatuses([]);
        setFilterColors([]);
        setFilterCategories(payload.category ? [payload.category] : []);
        setShowFilters(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    const deleteModalRef = useModalDismiss<HTMLDivElement>(() => setDeleteConfirmInfo(null), Boolean(deleteConfirmInfo));

    return (
        <div className="p-6 space-y-6">
            {/* Delete Confirmation Dialog */}
            {deleteConfirmInfo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div ref={deleteModalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-[480px] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95">
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-red-50/50">
                            <div className="flex gap-3">
                                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Delete Model</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Are you sure you want to delete <span className="font-semibold text-gray-800">{deleteConfirmInfo.name}</span>?</p>
                                </div>
                            </div>
                            <button onClick={() => setDeleteConfirmInfo(null)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {deleteConfirmInfo.assetsCount > 0 ? (
                                <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded-lg p-4 text-sm">
                                    <p className="font-semibold flex items-center gap-2 mb-2">
                                        <AlertTriangle className="h-4 w-4" /> Wait! This model is in use.
                                    </p>
                                    <p className="mb-3">
                                        This model cannot be safely deleted because it is associated with <strong>{deleteConfirmInfo.assetsCount}</strong> existing asset(s).
                                    </p>
                                    <Link
                                        href={`/inventory/cmdb/cis`}
                                        className="text-orange-700 font-semibold hover:underline inline-flex items-center gap-1"
                                    >
                                        View hardware assets <Search className="h-3 w-3" />
                                    </Link>

                                    <div className="mt-4 pt-4 border-t border-orange-200">
                                        <p className="text-orange-900 font-semibold mb-1">Force Delete?</p>
                                        <p className="text-xs text-orange-700/80 mb-3">By forcing this deletion, all associated hardware assets will be permanently removed.</p>
                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => setDeleteConfirmInfo(null)}
                                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-white rounded-lg transition-colors bg-orange-100/50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleConfirmDelete(true)}
                                                disabled={deletingId === deleteConfirmInfo.id}
                                                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {deletingId === deleteConfirmInfo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                Force Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-600">This action cannot be undone. This model will be permanently removed from the system.</p>
                                    <div className="flex justify-end items-center gap-3 pt-4">
                                        <button
                                            onClick={() => setDeleteConfirmInfo(null)}
                                            disabled={deletingId === deleteConfirmInfo.id}
                                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => handleConfirmDelete(false)}
                                            disabled={deletingId === deleteConfirmInfo.id}
                                            className="px-6 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {deletingId === deleteConfirmInfo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Asset Models</h1>
                    <p className="text-gray-500 mt-1">
                        Define abstract equipment models (e.g. Dell Latitude 5520).
                    </p>
                </div>
                <CreateModelDialog manufacturers={manufacturers} onCreated={handleModelCreated} />
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
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={exportAsCsv}
                                disabled={filteredModels.length === 0}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Export filtered rows as CSV"
                            >
                                <FileText className="h-4 w-4" />
                                CSV
                            </button>
                            <button
                                type="button"
                                onClick={exportAsExcel}
                                disabled={filteredModels.length === 0}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Export filtered rows grouped by model and color"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Excel by Color
                            </button>
                            <button
                                type="button"
                                onClick={exportAsModelSummaryExcel}
                                disabled={filteredModels.length === 0}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Export filtered rows grouped into one row per unique model"
                            >
                                <FileSpreadsheet className="h-4 w-4" />
                                Excel by Model
                            </button>
                        </div>

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
                        <div className="text-sm text-gray-500 whitespace-nowrap pl-2 border-l border-gray-200 flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1">
                            <div>
                                Models: <span className="font-bold text-gray-900">{uniqueModelNameCount}</span>
                            </div>
                            <div className="hidden sm:block w-px h-3 bg-gray-200" />
                            <div>
                                Total Stock: <span className="font-bold text-blue-600">{totalStock}</span>
                                <span className="text-[10px] ml-1 uppercase opacity-60">({totalAvailable} Avail / {totalAssigned} Use)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="w-full">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Inventory Intake</div>
                            <InventoryOrderCalendar />
                        </div>
                        {/* Status Filter */}
                        <MultiSelectFilter
                            label="Stock Status"
                            options={statusOptions}
                            selectedValues={filterStatuses}
                            onChange={setFilterStatuses}
                            allLabel="All Statuses"
                        />

                        {/* Category Filter */}
                        <MultiSelectFilter
                            label="Category"
                            options={categories}
                            selectedValues={filterCategories}
                            onChange={setFilterCategories}
                            allLabel="All Categories"
                        />

                        {/* Manufacturer Filter */}
                        <MultiSelectFilter
                            label="Manufacturer"
                            options={manufacturerOptions}
                            selectedValues={filterManufacturers}
                            onChange={setFilterManufacturers}
                            allLabel="All Manufacturers"
                        />

                        {/* Location Filter */}
                        {storageLocationOptions.length > 0 && (
                            <MultiSelectFilter
                                label="Storage Location"
                                options={storageLocationOptions}
                                selectedValues={filterLocations}
                                onChange={setFilterLocations}
                                allLabel="All Locations"
                            />
                        )}

                        {/* Color Filter */}
                        <MultiSelectFilter
                            label="Color"
                            options={colorOptions}
                            selectedValues={filterColors}
                            onChange={setFilterColors}
                            allLabel="All Colors"
                        />

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

            {shouldShowWarehouseOverview && warehouseOverviewGroups.length > 0 && (
                <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/60 p-4 sm:p-5 shadow-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {singleWarehouseOverviewGroup ? "Warehouse overview for selected item" : "Warehouse overview for filtered items"}
                                </h3>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                {singleWarehouseOverviewGroup
                                    ? "A single, combined view of this item across all warehouses, even if it appears in multiple colors or rows."
                                    : "Exact available stock by warehouse for the item or items that match your current search and filters."}
                            </p>
                        </div>
                        <div className="text-xs text-gray-500">
                            {singleWarehouseOverviewGroup ? (
                                <>
                                    1 combined item view
                                </>
                            ) : (
                                <>
                                    Showing top <span className="font-semibold text-gray-900">{warehouseOverviewModels.length}</span>
                                    {" "}of <span className="font-semibold text-gray-900">{warehouseOverviewGroups.length}</span> item{warehouseOverviewGroups.length === 1 ? "" : "s"}
                                </>
                            )}
                        </div>
                    </div>

                    {singleWarehouseOverviewGroup ? (
                        <div className="mt-4 rounded-2xl border border-blue-300 bg-white p-5 shadow-md ring-1 ring-blue-100 md:sticky md:top-4 md:z-10">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div className="min-w-0">
                                    <Link
                                        href={`/inventory/cmdb/models/${singleWarehouseOverviewGroup.modelId}`}
                                        className="block truncate text-lg font-semibold text-blue-700 hover:text-blue-800"
                                        title={singleWarehouseOverviewGroup.modelName}
                                    >
                                        {singleWarehouseOverviewGroup.modelName}
                                    </Link>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {Array.from(singleWarehouseOverviewGroup.series).sort().join(" | ") || "No series"}
                                    </p>
                                    <div className="mt-2 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                        Focused item snapshot
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                            {singleWarehouseOverviewGroup.category || "Uncategorized"}
                                        </span>
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                                            {singleWarehouseOverviewGroup.manufacturer || "Unknown manufacturer"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedOverviewColor("__all__")}
                                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                                activeSingleOverviewColor === "__all__"
                                                    ? "border-blue-400 bg-blue-600 text-white shadow-sm"
                                                    : "border-blue-200 bg-white text-blue-700 hover:border-blue-300"
                                            }`}
                                            title="Show total stock across all colors and all warehouses"
                                        >
                                            <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-yellow-400" />
                                            <span>All Colors</span>
                                        </button>
                                        {Array.from(singleWarehouseOverviewGroup.colors).sort().map((color) => {
                                            const active = color === activeSingleOverviewColor;
                                            return (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setSelectedOverviewColor(color)}
                                                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${getOverviewColorBadgeClasses(color, active)}`}
                                                    title={`Show ${color} stock across all warehouses`}
                                                >
                                                    <span className={`h-2.5 w-2.5 rounded-full border border-black/10 ${getOverviewColorDotClass(color)}`} />
                                                    <span>{color}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[420px]">
                                    <div className="rounded-xl bg-blue-50 px-4 py-3">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Available</div>
                                        <div className="mt-1 text-2xl font-bold text-blue-900">{activeSingleOverviewColorSummary?.availableStock ?? singleWarehouseOverviewGroup.availableStock}</div>
                                    </div>
                                    <div className="rounded-xl bg-emerald-50 px-4 py-3">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Warehouses</div>
                                        <div className="mt-1 text-2xl font-bold text-emerald-900">{activeSingleOverviewWarehouseEntries.length}</div>
                                    </div>
                                    <div className="rounded-xl bg-amber-50 px-4 py-3">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">Assigned</div>
                                        <div className="mt-1 text-2xl font-bold text-amber-900">{activeSingleOverviewColorSummary?.assignedStock ?? singleWarehouseOverviewGroup.assignedStock}</div>
                                    </div>
                                    <div className="rounded-xl bg-violet-50 px-4 py-3">
                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-600">Active color</div>
                                        <div className="mt-1 text-base font-bold text-violet-900">
                                            {activeSingleOverviewColor === "__all__" ? "All Colors" : (activeSingleOverviewColor || "None")}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {activeSingleOverviewWarehouseEntries.map((entry) => (
                                    <div
                                        key={`${singleWarehouseOverviewGroup.modelId}-${activeSingleOverviewColor || "all"}-${entry.location}`}
                                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <MapPin className="h-4 w-4 text-blue-500" />
                                                <span className="truncate text-sm font-semibold text-gray-900">{entry.location}</span>
                                            </div>
                                            <span className="text-xl font-bold text-gray-900">{entry.quantity}</span>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {activeSingleOverviewColor === "__all__"
                                                ? "Available total stock in this warehouse"
                                                : activeSingleOverviewColor
                                                    ? `Available ${activeSingleOverviewColor} stock in this warehouse`
                                                    : "Available now in this warehouse"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {warehouseOverviewModels.map((group) => {
                                const warehouseEntries = formatWarehouseEntries(group.locationStocks);

                                return (
                                    <div key={`${group.modelId}-${group.modelName}-${group.category}-${group.manufacturer}`} className="rounded-xl border border-blue-100 bg-white/90 p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/inventory/cmdb/models/${group.modelId}`}
                                                    className="block truncate text-sm font-semibold text-blue-700 hover:text-blue-800"
                                                    title={group.modelName}
                                                >
                                                    {group.modelName}
                                                </Link>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {Array.from(group.series).sort().join(" | ") || "No series"}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                                                    {warehouseEntries.length} warehouse{warehouseEntries.length === 1 ? "" : "s"}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {group.availableStock} available
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {warehouseEntries.map((entry) => (
                                                <span
                                                    key={`${group.modelName}-${entry.location}`}
                                                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700"
                                                    title={`${entry.location}: ${entry.quantity}`}
                                                >
                                                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                    <span className="font-medium">{entry.location}</span>
                                                    <span className="text-gray-500">•</span>
                                                    <span className="font-semibold text-gray-900">{entry.quantity}</span>
                                                </span>
                                            ))}
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                                            <span>Assigned: <span className="font-semibold text-gray-900">{group.assignedStock}</span></span>
                                            <span>Active devices: <span className="font-semibold text-gray-900">{group.activeDevices}</span></span>
                                            <span>Rows merged: <span className="font-semibold text-gray-900">{group.sourceModels}</span></span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div className="rounded-md border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="h-12 px-4 align-middle font-medium w-[25%] min-w-[200px]">Model Name</th>
                            <th className="h-12 px-4 align-middle font-medium w-[20%] min-w-[150px]">Series</th>
                            <th className="h-12 px-4 align-middle font-medium min-w-[120px]">Manufacturer</th>
                            <th className="h-12 px-4 align-middle font-medium min-w-[120px]">Category</th>
                            <th className="h-12 px-4 align-middle font-medium min-w-[100px]">Color</th>
                            <th className="h-12 px-4 align-middle font-medium min-w-[150px]">Location</th>
                            <th className="h-12 px-4 align-middle font-medium text-center min-w-[80px]">Stock</th>
                            <th className="h-12 px-4 align-middle font-medium text-center min-w-[100px]">Stock Status</th>
                            <th className="h-12 px-4 align-middle font-medium text-center min-w-[100px]">Condition</th>
                            <th className="h-12 px-4 align-middle font-medium min-w-[100px]">Active Devices</th>
                            <th className="h-12 px-4 align-middle font-medium text-right min-w-[160px]">Actions</th>
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
                                    <td className="p-4">
                                        <Link
                                            href={`/inventory/cmdb/models/${m.ModelID}`}
                                            className="flex items-center gap-3 group"
                                        >
                                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                                {m.ImageURL ? (
                                                    <Image
                                                        src={m.ImageURL}
                                                        alt={m.Name}
                                                        fill
                                                        unoptimized
                                                        sizes="48px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                                        No image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex min-w-0 flex-col">
                                                <span className="font-semibold text-blue-600 hover:text-blue-800 transition-colors group-hover:underline truncate">
                                                    {m.Name}
                                                </span>
                                                {m.ModelNumber && <span className="text-xs text-muted-foreground mt-0.5">{m.ModelNumber}</span>}
                                                <span className="text-[11px] text-gray-400 mt-0.5">
                                                    {m.ImageURL ? "Reference image saved" : "No reference image"}
                                                </span>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="p-4 relative">
                                        {m.Series ? (
                                            <div className="flex items-start gap-1 flex-wrap max-w-[250px]">
                                                <span className="text-sm text-gray-700 leading-snug">
                                                    {m.Series.length > 50 ? `${m.Series.substring(0, 50)}... ` : m.Series}
                                                </span>
                                                {m.Series.length > 50 && (
                                                    <button
                                                        onClick={() => setViewSeriesId(m.ModelID)}
                                                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
                                                    >
                                                        [View all]
                                                    </button>
                                                )}

                                                {/* Inline Popover for Full Series */}
                                                {viewSeriesId === m.ModelID && (
                                                    <div className="absolute top-10 left-4 z-50 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-in fade-in zoom-in-95">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">All Series</h4>
                                                            <button onClick={() => setViewSeriesId(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                        <p className="text-sm text-gray-700 leading-relaxed max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                                            {m.Series}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
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
                                        {m.Color ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: m.Color.toLowerCase() === 'magenta' ? '#FF00FF' : m.Color.toLowerCase() === 'cyan' ? '#00FFFF' : m.Color.toLowerCase() === 'yellow' ? '#FFFF00' : '#000000' }} />
                                                <span className="text-xs font-medium">{m.Color}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">—</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                <span className={`text-sm ${m.DefaultLocationName ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}`}>
                                                    {m.DefaultLocationName || "Not Set"}
                                                </span>
                                            </div>
                                            {m.locationStocks?.size > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {formatWarehouseRows(m.locationStocks, 2).map((row) => (
                                                        <span
                                                            key={row.location}
                                                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-700"
                                                            title={`${row.location}: ${row.quantity}`}
                                                        >
                                                            <span className="max-w-[120px] truncate">{row.location}</span>
                                                            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                                {row.quantity}
                                                            </span>
                                                        </span>
                                                    ))}
                                                    {m.locationStocks.size > 2 && (
                                                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                                            +{m.locationStocks.size - 2} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <span className={`text-lg font-bold ${(m.AvailableStock || 0) <= 0 ? "text-red-500" : "text-gray-900"}`}>
                                                {m.AvailableStock || 0}
                                            </span>
                                            <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap mt-0.5">
                                                {m.AssignedStock || 0} in use
                                            </span>
                                            {(() => {
                                                const lastIntake = getLastIntakeBadge(m.LastIncomingActionType);
                                                if (!lastIntake) return null;

                                                return (
                                                    <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${lastIntake.className}`}>
                                                        {lastIntake.label}
                                                    </span>
                                                );
                                            })()}
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
                                    {/* ✅ Model Condition Status */}
                                    <td className="p-4 text-center">
                                        {m.Status ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
                                                {m.Status}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">—</span>
                                        )}
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
                                        {m.ImageURL && (
                                            <a
                                                href={m.ImageURL}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={TABLE_ACTION_BUTTON_SECONDARY}
                                                title="View reference image"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                <span>View Image</span>
                                            </a>
                                        )}
                                        {/* Primary Action Button */}
                                        <Link
                                            href={`/assign?modelId=${m.ModelID}${m.DefaultLocationID ? `&locationId=${m.DefaultLocationID}` : ''}`}
                                            className={`${(m.AvailableStock || 0) <= 0
                                                ? TABLE_ACTION_BUTTON_PRIMARY_DISABLED
                                                : TABLE_ACTION_BUTTON_PRIMARY
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
                                                className={`${TABLE_ACTION_BUTTON_SECONDARY} ${openDropdownId === m.ModelID
                                                    ? "bg-gray-100 text-gray-900 border-gray-300"
                                                    : ""
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
                                                                handleDeleteClick(m.ModelID, m.Name);
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
