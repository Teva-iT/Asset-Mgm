'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AddStockDialog from '@/components/cmdb/AddStockDialog'
import { AlertTriangle } from 'lucide-react'

export default function LowStockDashboard() {
    const [models, setModels] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/models/low-stock')
            .then(res => res.json())
            .then(data => {
                setModels(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch low stock', err)
                setLoading(false)
            })
    }, [])

    if (loading) {
        return (
            <div className="mb-10 p-8 text-center bg-white rounded-xl border border-gray-100 animate-pulse">
                <div className="h-4 w-32 bg-gray-200 rounded mx-auto mb-4"></div>
                <div className="h-8 w-64 bg-gray-100 rounded mx-auto"></div>
            </div>
        )
    }

    if (models.length === 0) return null

    return (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Low Stock Items</h2>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-orange-50/50 text-orange-800 border-b border-orange-100">
                        <tr>
                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Model</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Manufacturer</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-center">Available</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-center">Reorder Level</th>
                            <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50">
                        {models.map(model => {
                            const isOutOfStock = model.Status === 'Out of Stock';
                            return (
                                <tr key={model.ModelID} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <Link href={`/inventory/cmdb/models/${model.ModelID}`} className="font-bold text-gray-900 hover:text-blue-600 transition-colors">
                                            {model.Name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium text-xs">
                                        {model.Manufacturer?.Name}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded font-bold ${isOutOfStock ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {model.AvailableStock || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-500 font-medium">{model.ReorderLevel}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${isOutOfStock ? 'bg-red-50 text-red-700 border-red-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                {model.Status}
                                            </span>
                                            {isOutOfStock && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-red-500 font-bold animate-pulse">Action:</span>
                                                    <AddStockDialog model={model} triggerLabel="Quick Refill" variant="ghost-red" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
