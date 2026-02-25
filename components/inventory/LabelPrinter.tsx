
"use client";

import { Printer } from "lucide-react";

export default function LabelPrinter({ asset, qrUrl }: { asset: any, qrUrl: string }) {

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 print:bg-white print:p-8 print:items-start print:justify-start">

            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: auto; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}</style>

            <div className="bg-white border-2 border-black rounded-lg w-[380px] h-[190px] flex items-center p-4 gap-4 shadow-xl print:shadow-none print:border-black print:rounded-none relative overflow-hidden">

                {/* QR Code */}
                <div className="w-[120px] h-[120px] flex-shrink-0 bg-white p-1 border border-gray-100 rounded print:border-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
                </div>

                {/* Info */}
                <div className="flex flex-col justify-between h-full py-1 flex-grow overflow-hidden">
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tight text-black leading-none mb-0.5">Asset Manager</h1>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Property of IT Dept</span>
                    </div>

                    <div className="space-y-2 mt-auto">
                        <div>
                            <span className="text-[9px] uppercase text-gray-400 font-bold block mb-0.5">Asset Tag / SN</span>
                            <span className="text-lg font-mono font-bold text-black leading-none block truncate">
                                {asset.AssetTag || asset.SerialNumber}
                            </span>
                        </div>

                        <div className="border-t-2 border-gray-100 pt-1.5 mt-1 border-dashed">
                            <span className="text-[9px] uppercase text-gray-400 font-bold block mb-0.5">Model</span>
                            <span className="text-xs font-bold text-gray-800 leading-tight block truncate w-full">
                                {asset.AssetModel?.Name || 'Unknown Model'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4 print:hidden flex-col items-center">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Printer className="w-5 h-5" />
                    Print Label
                </button>
                <div className="text-gray-400 text-xs text-center max-w-sm">
                    Recommended: Use "Label Printer" or set paper size to 10cm x 5cm.<br />
                    Disable headers/footers in print dialog.
                </div>
            </div>
        </div>
    );
}
