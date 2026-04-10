"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Package, TrendingUp, BarChart2, History, Plus, Minus, RefreshCw, ExternalLink, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";

const ACTION_META: Record<string, { color: string; label: string; icon: any }> = {
    ADD: { icon: Plus, color: "text-green-700 bg-green-50", label: "Purchase" },
    OPENING_STOCK: { icon: Plus, color: "text-emerald-700 bg-emerald-50", label: "Opening Stock" },
    ASSIGN: { icon: Minus, color: "text-blue-700 bg-blue-50", label: "Assigned" },
    RETURN: { icon: RefreshCw, color: "text-indigo-700 bg-indigo-50", label: "Returned" },
    ADJUST: { icon: RefreshCw, color: "text-orange-700 bg-orange-50", label: "Adjusted" },
    ADJUST_OPENING_STOCK: { icon: RefreshCw, color: "text-amber-700 bg-amber-50", label: "Adjust Opening Stock" },
    ADJUST_PURCHASE: { icon: RefreshCw, color: "text-orange-700 bg-orange-50", label: "Adjust Purchase Stock" },
    LOCATION_CHANGE: { icon: RefreshCw, color: "text-purple-700 bg-purple-50", label: "Relocated" },
};

interface ChartPoint { date: string; stock: number }

function StockTrendChart({ points }: { points: ChartPoint[] }) {
    if (points.length < 2) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                Not enough data to draw chart.
            </div>
        );
    }

    const W = 680, H = 180, PAD = { t: 20, r: 20, b: 40, l: 44 };
    const xs = PAD.l, xe = W - PAD.r;
    const ys = PAD.t, ye = H - PAD.b;

    const maxV = Math.max(...points.map(p => p.stock), 1);
    const minV = Math.min(...points.map(p => p.stock), 0);
    const range = maxV - minV || 1;

    const px = (i: number) => xs + (i / (points.length - 1)) * (xe - xs);
    const py = (v: number) => ye - ((v - minV) / range) * (ye - ys);

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(1)},${py(p.stock).toFixed(1)}`).join(" ");
    const areaD = `${pathD} L${px(points.length - 1).toFixed(1)},${ye} L${px(0).toFixed(1)},${ye} Z`;

    // Y axis ticks
    const ticks = 4;
    const yTicks = Array.from({ length: ticks + 1 }, (_, i) => minV + Math.round((range / ticks) * i));

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
            <defs>
                <linearGradient id="stock-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
            </defs>

            {/* Grid lines */}
            {yTicks.map(v => (
                <g key={v}>
                    <line x1={xs} y1={py(v)} x2={xe} y2={py(v)} stroke="#e5e7eb" strokeWidth="1" />
                    <text x={xs - 6} y={py(v) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{v}</text>
                </g>
            ))}

            {/* Area fill */}
            <path d={areaD} fill="url(#stock-gradient)" />

            {/* Line */}
            <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

            {/* Dots + date labels */}
            {points.map((p, i) => {
                const x = px(i), y = py(p.stock);
                const showLabel = points.length <= 10 || i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 8) === 0;
                return (
                    <g key={i}>
                        <circle cx={x} cy={y} r="4" fill="white" stroke="#3b82f6" strokeWidth="2" />
                        {showLabel && (
                            <text x={x} y={ye + 16} textAnchor="middle" fontSize="9" fill="#6b7280">
                                {new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

export default function ModelDetailContent({ modelId }: { modelId: string }) {
    const router = useRouter();
    const [data, setData] = useState<{ model: any; history: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/models/${modelId}`)
            .then(r => r.json())
            .then((payload) => {
                setData(payload);
                const firstPhoto = payload?.model?.ModelPhotos?.[0]?.URL || payload?.model?.ImageURL || null;
                setSelectedImageUrl(firstPhoto);
            })
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [modelId]);

    // Build cumulative chart points from history
    const chartPoints = useMemo((): ChartPoint[] => {
        if (!data?.history?.length) return [];
        let cumulative = 0;
        return data.history.map(r => {
            cumulative += r.Quantity;
            return { date: r.CreatedAt, stock: Math.max(0, cumulative) };
        });
    }, [data]);

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>
    );
    if (!data?.model) return (
        <div className="flex items-center justify-center h-64 text-red-400">Model not found.</div>
    );

    const { model, history } = data;
    const referencePhotos = Array.isArray(model.ModelPhotos) && model.ModelPhotos.length > 0
        ? model.ModelPhotos
        : (model.ImageURL ? [{ URL: model.ImageURL, Category: "Reference" }] : []);
    const activeImageUrl = selectedImageUrl || referencePhotos[0]?.URL || null;
    const recentHistory = [...history].reverse().slice(0, 20);

    const stockStatus = (() => {
        const a = model.AvailableStock || 0, r = model.ReorderLevel || 0;
        if (a <= 0) return { label: "Out of Stock", color: "text-red-600 bg-red-50 border-red-200", dot: "🔴" };
        if (r > 0 && a <= r) return { label: `Low Stock (${a} left)`, color: "text-orange-600 bg-orange-50 border-orange-200", dot: "🟡" };
        return { label: "Healthy", color: "text-green-600 bg-green-50 border-green-200", dot: "🟢" };
    })();

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Back */}
            <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Models
            </button>

            {/* Title + status */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{model.Name}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {model.Manufacturer?.Name} · {model.Category}
                        {model.Color && (
                            <>
                                <span className="mx-2 text-gray-300">|</span>
                                <span className="inline-flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full border border-gray-400" style={{ backgroundColor: model.Color.toLowerCase() }} />
                                    {model.Color}
                                </span>
                            </>
                        )}
                    </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${stockStatus.color}`}>
                    {stockStatus.dot} {stockStatus.label}
                </span>
            </div>

            {/* Model Image and Stats */}
            <div className="flex flex-col md:flex-row gap-6">
                {activeImageUrl && (
                    <a
                        href={activeImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative w-full md:w-64 aspect-square bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-shrink-0 block"
                        title="Open reference image"
                    >
                        <Image src={activeImageUrl} alt={model.Name} fill unoptimized sizes="(max-width: 768px) 100vw, 256px" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/65 px-3 py-2 text-xs text-white flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Reference image</span>
                            <span className="inline-flex items-center gap-1">
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open
                            </span>
                        </div>
                    </a>
                )}
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 self-start">
                    {[
                        { label: "Total Stock", value: model.TotalStock || 0, color: "text-gray-900", icon: Package },
                        { label: "Available", value: model.AvailableStock || 0, color: "text-green-600", icon: TrendingUp },
                        { label: "Assigned", value: model.AssignedStock || 0, color: "text-blue-600", icon: BarChart2 },
                        {
                            label: "Last Update",
                            value: history.length > 0 ? new Date(history[history.length - 1].CreatedAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' }) : "Never",
                            color: "text-orange-500",
                            icon: History
                        },
                    ].map(({ label, value, color, icon: Icon }) => (
                        <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500">{label}</span>
                                <Icon className={`h-4 w-4 ${color}`} />
                            </div>
                            <span className={`text-2xl font-bold ${color}`}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {model.PurchaseDate && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <CalendarDays className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Purchase Date</div>
                            <div className="text-sm font-semibold text-gray-900">
                                {new Date(model.PurchaseDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {referencePhotos.length > 1 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-bold text-gray-800">Reference Gallery</h2>
                        <span className="text-xs text-gray-400">{referencePhotos.length} images saved</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {referencePhotos.map((photo: any, index: number) => {
                            const isActive = photo.URL === activeImageUrl;
                            return (
                                <button
                                    key={photo.PhotoID || `${photo.URL}-${index}`}
                                    type="button"
                                    onClick={() => setSelectedImageUrl(photo.URL)}
                                    className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-colors ${isActive ? "border-blue-500" : "border-gray-200 hover:border-blue-300"}`}
                                    title={`Show reference image ${index + 1}`}
                                >
                                    <Image src={photo.URL} alt={`Reference ${index + 1}`} fill unoptimized sizes="80px" className="object-cover" />
                                    {index === 0 && (
                                        <span className="absolute left-1 top-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                            Primary
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-gray-800">Stock Trend</h2>
                    <span className="text-xs text-gray-400">Cumulative available stock over time</span>
                </div>
                <StockTrendChart points={chartPoints} />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-gray-800">Recent Activity</h2>
                    <span className="text-xs text-gray-400">{history.length} total records</span>
                </div>
                {recentHistory.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No activity yet.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentHistory.map((r: any) => {
                                const meta = ACTION_META[r.ActionType] || ACTION_META.ADD;
                                const Icon = meta.icon;
                                return (
                                    <tr key={r.RecordID} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${meta.color}`}>
                                                <Icon className="h-3 w-3" />{meta.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`font-bold ${r.Quantity > 0 ? "text-green-600" : "text-red-500"}`}>
                                                {r.Quantity > 0 ? `+${r.Quantity}` : r.Quantity}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">{r.StorageLocation?.Name || "—"}</td>
                                        <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                                            {r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                        </td>
                                        <td className="px-5 py-3 text-gray-400 text-xs max-w-[200px] truncate" title={r.Notes}>{r.Notes || "—"}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
