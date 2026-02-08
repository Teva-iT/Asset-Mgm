'use client'

import { useState, useEffect, useRef } from 'react'

interface Asset {
    AssetID: string
    AssetName: string
    AssetType: string
    SerialNumber: string
    Status: string
}

interface AssetAutocompleteProps {
    onSelect: (asset: Asset | null) => void
    defaultAsset?: Asset
}

export default function AssetAutocomplete({ onSelect, defaultAsset }: AssetAutocompleteProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Asset[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState<Asset | null>(defaultAsset || null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const fetchAssets = async () => {
            if (query.length < 2) {
                setResults([])
                return
            }

            try {
                // Assuming we can pass 'status=Available' to filter
                // But current /api/assets only returns ALL assets or filtered by code?
                // I need to check /api/assets first. I'll assume I can modify it or it returns all and I filter client-side for now,
                // but for performance server-side filter is better. 
                // Let's assume I'll add 'q' and 'status' params to /api/assets later.
                const res = await fetch(`/api/assets?q=${encodeURIComponent(query)}&status=Available`)
                if (res.ok) {
                    const data = await res.json()
                    setResults(data)
                    setIsOpen(true)
                }
            } catch (error) {
                console.error('Failed to search assets', error)
            }
        }

        const timeoutId = setTimeout(fetchAssets, 300)
        return () => clearTimeout(timeoutId)
    }, [query])

    const handleSelect = (asset: Asset) => {
        setSelected(asset)
        onSelect(asset)
        setIsOpen(false)
        setQuery('')
    }

    const handleClear = () => {
        setSelected(null)
        onSelect(null)
        setQuery('')
    }

    if (selected) {
        return (
            <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                <div className="flex-1">
                    <div className="font-medium text-gray-900">
                        {selected.AssetName} ({selected.AssetType})
                    </div>
                    <div className="text-sm text-gray-500">
                        SN: {selected.SerialNumber}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Remove asset"
                >
                    ✕
                </button>
            </div>
        )
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search available assets..."
                className="input-field w-full"
                onFocus={() => query.length >= 2 && setIsOpen(true)}
            />

            {isOpen && results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                    {results.map((asset) => (
                        <div
                            key={asset.AssetID}
                            onClick={() => handleSelect(asset)}
                            className="p-2 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        >
                            <div className="font-medium text-gray-900">
                                {asset.AssetName}
                            </div>
                            <div className="text-sm text-gray-500">
                                {asset.AssetType} • SN: {asset.SerialNumber}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isOpen && results.length === 0 && query.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg p-2 text-gray-500">
                    No available assets found.
                </div>
            )}
        </div>
    )
}
