
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, FileSpreadsheet, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { importAssets } from "@/app/actions/import";

export default function AssetImporter() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; count?: number; errors?: string[] } | null>(null);
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setResult(null);

        const formData = new FormData(event.currentTarget);
        const res = await importAssets(formData);

        setResult(res);
        setLoading(false);

        if (res.success) {
            router.refresh();
        }
    }

    return (
        <>
            <div className="flex gap-2">
                <a
                    href="/api/export/assets"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm transition-all h-10 px-4 py-2"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </a>
                <button
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all h-10 px-4 py-2"
                >
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                </button>
            </div>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[550px] overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div className="flex gap-3">
                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                    <FileSpreadsheet className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Bulk Import Assets</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Upload Excel (.xlsx) file to add assets</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setOpen(false); setResult(null); }}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            {!result?.success ? (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                                            <strong>Instructions:</strong>
                                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                                <li>File must be <code>.xlsx</code> format.</li>
                                                <li>Required columns: <code>Model</code>, <code>Serial Number</code>.</li>
                                                <li>Optional: <code>Asset Tag</code>, <code>Status</code>, <code>Condition</code>, <code>Location</code>, <code>Notes</code>.</li>
                                                <li>Ensure "Model" matches existing models exactly independently.</li>
                                            </ul>
                                        </div>

                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-gray-700">
                                                Select File
                                            </label>
                                            <input
                                                type="file"
                                                name="file"
                                                accept=".xlsx, .xls"
                                                required
                                                className="block w-full text-sm text-gray-500
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-md file:border-0
                                                    file:text-sm file:font-semibold
                                                    file:bg-blue-50 file:text-blue-700
                                                    hover:file:bg-blue-100
                                                    cursor-pointer border border-gray-200 rounded-lg"
                                            />
                                        </div>
                                    </div>

                                    {result?.errors && (
                                        <div className="p-4 bg-red-50 text-red-800 rounded-lg text-sm border border-red-100">
                                            <div className="flex items-center gap-2 font-bold mb-2">
                                                <AlertCircle className="h-4 w-4" /> Import Failed with {result.errors.length} errors:
                                            </div>
                                            <ul className="list-disc pl-5 space-y-1 max-h-32 overflow-y-auto">
                                                {result.errors.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setOpen(false)}
                                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {loading ? 'Importing...' : 'Upload & Import'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="text-center space-y-6 py-4">
                                    <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Import Successful!</h3>
                                        <p className="text-gray-600 mt-2">
                                            Successfully imported <span className="font-bold text-green-700">{result.count}</span> assets.
                                        </p>
                                    </div>

                                    {result.errors && (
                                        <div className="p-4 bg-amber-50 text-amber-800 rounded-lg text-sm border border-amber-100 text-left">
                                            <div className="font-bold mb-1">Warnings / Skipped Rows:</div>
                                            <ul className="list-disc pl-5 space-y-1 max-h-32 overflow-y-auto">
                                                {result.errors.map((err, i) => (
                                                    <li key={i}>{err}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => { setOpen(false); setResult(null); }}
                                        className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
