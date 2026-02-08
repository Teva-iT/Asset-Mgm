'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useZxing } from "react-zxing";

const BarcodeScanner = ({ onResult, onClose }: { onResult: (result: string) => void, onClose: () => void }) => {
    const { ref } = useZxing({
        onDecodeResult(result) {
            onResult(result.getText());
        },
        onError(error) {
            // Create a more user-friendly error handler or ignore noisy errors
            // console.warn(error); 
        },
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-md relative">
                <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Scan Barcode</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div className="relative bg-black h-64">
                    <video ref={ref} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-2 border-white/50 m-8 rounded-lg pointer-events-none"></div>
                    <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm">Point camera at barcode</p>
                </div>
                <div className="p-4 bg-gray-50 text-center">
                    <button onClick={onClose} className="btn btn-outline w-full">Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default function InventoryScanner() {
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // --- Input Method Detection & Camera State ---
    const [showCamera, setShowCamera] = useState(false)
    const [inputMethod, setInputMethod] = useState<'Scanner' | 'Manual' | 'Camera'>('Manual')
    const lastKeyTime = useRef<number>(0)
    const isRapidInput = useRef<boolean>(true) // Assume rapid until proven slow

    // Reset detection on empty query
    useEffect(() => {
        if (!query) {
            isRapidInput.current = true
            setInputMethod('Manual') // Default reset
        }
    }, [query])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        const now = Date.now()
        const diff = now - lastKeyTime.current

        // Logic: Scanners are SUPER fast. Humans usually > 30-50ms per key.
        // We allow the first char to be slow, but subsequent chunks should be fast for scanner.
        if (query.length > 0 && diff > 40) {
            isRapidInput.current = false
        }

        lastKeyTime.current = now
    }

    const handleCameraResult = (scanResult: string) => {
        setQuery(scanResult)
        setShowCamera(false)
        setInputMethod('Camera') // Explicitly set logic
        // Auto-trigger search is tricky with React state updates. 
        // We'll call a dedicated internal search function with the value directly.
        executeSearch(scanResult, 'Camera')
    }

    // Wrapped Search to accept direct values (for Camera)
    const executeSearch = async (searchQuery: string, methodOverride?: 'Scanner' | 'Manual' | 'Camera') => {
        if (!searchQuery.trim()) return

        setLoading(true)
        setResult(null)
        setError('')

        // Determine method if not overridden
        const finalMethod = methodOverride || (isRapidInput.current && searchQuery.length > 3 ? 'Scanner' : 'Manual')

        try {
            const res = await fetch(`/api/assets/search?q=${encodeURIComponent(searchQuery)}`)
            const data = await res.json()

            if (data.error) {
                setError(data.error)
                fetch('/api/scan-history', { method: 'POST', body: JSON.stringify({ outcome: 'Error', method: finalMethod, query: searchQuery }) })
            } else if (data.found) {
                setResult(data.asset)
                fetch('/api/scan-history', {
                    method: 'POST',
                    body: JSON.stringify({
                        outcome: 'Found',
                        method: finalMethod,
                        query: searchQuery,
                        assetId: data.asset.AssetID,
                        assetStatus: data.asset.Status
                    })
                })
            } else {
                setResult('NOT_FOUND')
                fetch('/api/scan-history', {
                    method: 'POST',
                    body: JSON.stringify({
                        outcome: 'Not Found',
                        method: finalMethod,
                        query: searchQuery
                    })
                })
            }
        } catch (err) {
            setError('Failed to search. Please try again.')
            await fetch('/api/scan-history', {
                method: 'POST',
                body: JSON.stringify({
                    outcome: 'Error',
                    method: finalMethod,
                    query: searchQuery
                })
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        executeSearch(query)
    }
    // ... (rest of simple handlers)

    const clearSearch = () => {
        setQuery('')
        setResult(null)
        setError('')
        inputRef.current?.focus()
        isRapidInput.current = true // Reset assumption
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            {showCamera && <BarcodeScanner onResult={handleCameraResult} onClose={() => setShowCamera(false)} />}

            <form onSubmit={handleSearch} className="mb-6">
                <div className="relative flex gap-2">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            {loading ? (
                                <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg className="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                            )}
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            className="block w-full pl-12 pr-4 py-4 text-xl border-2 border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400"
                            placeholder="Scan or enter asset barcode..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>

                    {/* Camera Button (Mobile/Tablet optimized) */}
                    <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex items-center justify-center aspect-square h-auto bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl border-2 border-gray-200 transition-colors"
                        title="Scan with Camera"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>
                    </button>
                </div>
            </form>

            {/* Same Results Logic */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 animate-fade-in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {error}
                </div>
            )}

            {result === 'NOT_FOUND' && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center animate-fade-in">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-200 mb-4">
                        <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Asset Not Found</h3>
                    <p className="text-gray-500 mb-6">No asset found with number "{query}"</p>
                    <div className="flex justify-center gap-3">
                        <button onClick={clearSearch} className="btn btn-outline">Cancel</button>
                        <Link href={`/assets/new?serial=${encodeURIComponent(query)}`} className="btn btn-primary">
                            Create New Asset
                        </Link>
                    </div>
                </div>
            )}

            {result && result !== 'NOT_FOUND' && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 animate-fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.Status === 'Available' ? 'bg-green-100 text-green-800' :
                                    result.Status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                                        result.Status === 'Lost' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {result.Status || 'Unknown Status'}
                                </span>
                                {result.Condition && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {result.Condition}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{result.AssetName || 'Unnamed Asset'}</h3>
                            <p className="text-gray-600 font-mono text-sm mt-1">
                                SN: {result.SerialNumber} • Tag: {result.DeviceTag || 'N/A'} • {result.AssetType}
                            </p>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            {/* Quick Actions */}
                            {result.Status === 'Available' && (
                                <Link href={`/assets/${result.AssetID}/assign`} className="btn btn-primary flex-1 md:flex-none text-center">
                                    Assign User
                                </Link>
                            )}
                            {result.Status === 'Assigned' && (
                                <Link href={`/assets/${result.AssetID}/return`} className="btn btn-outline flex-1 md:flex-none text-center bg-white">
                                    Return Asset
                                </Link>
                            )}
                            <Link href={`/assets/${result.AssetID}/edit`} className="btn btn-outline flex-1 md:flex-none text-center bg-white">
                                Edit
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
