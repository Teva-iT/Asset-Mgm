'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Check, Search } from 'lucide-react'

interface StorageLocation {
    LocationID: string
    Name: string
    ParentLocationID: string | null
    ParentLocation?: { Name: string }
    SubLocations?: StorageLocation[]
}

interface StorageLocationSelectProps {
    value?: string
    onChange: (value: string) => void
    error?: string
}

export default function StorageLocationSelect({ value, onChange, error }: StorageLocationSelectProps) {
    const [locations, setLocations] = useState<StorageLocation[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const wrapperRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch('/api/storage-locations')
                if (res.ok) {
                    const data = await res.json()
                    setLocations(data)
                }
            } catch (err) {
                console.error('Failed to fetch locations', err)
            } finally {
                setLoading(false)
            }
        }
        fetchLocations()
    }, [])

    // Organize into hierarchy (simple 2-level for now, or flat list with paths)
    // For dropdown, a flat list with full path is often easiest for users: "IT Room > Cupboard"

    const getFullPath = (loc: StorageLocation): string => {
        if (loc.ParentLocation) {
            return `${loc.ParentLocation.Name} > ${loc.Name}`
        }
        return loc.Name
    }

    const sortedLocations = locations
        .map(l => ({ ...l, fullPath: getFullPath(l) }))
        .sort((a, b) => a.fullPath.localeCompare(b.fullPath))

    const filteredLocations = sortedLocations.filter((loc) =>
        loc.fullPath.toLowerCase().includes(query.trim().toLowerCase())
    )

    function closeDropdown() {
        setIsOpen(false)
        setQuery('')
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                closeDropdown()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (!isOpen) return

        const timeoutId = window.setTimeout(() => searchInputRef.current?.focus(), 0)
        return () => window.clearTimeout(timeoutId)
    }, [isOpen])

    function handleSelect(locationId: string) {
        onChange(locationId)
        closeDropdown()
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={() => {
                    if (isOpen) {
                        closeDropdown()
                    } else {
                        setQuery('')
                        setIsOpen(true)
                    }
                }}
                className={`filter-control cursor-pointer justify-between w-full bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}
                disabled={loading}
            >
                <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-500'}`}>
                    {value ? sortedLocations.find(loc => loc.LocationID === value)?.fullPath || 'Select Storage Location...' : 'Select Storage Location...'}
                </span>
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl">
                    <div className="border-b border-gray-100 p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search storage locations..."
                                className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => handleSelect('')}
                            className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${!value ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                            Select Storage Location...
                        </button>
                        {filteredLocations.length > 0 ? (
                            filteredLocations.map(loc => (
                                <button
                                    key={loc.LocationID}
                                    type="button"
                                    onClick={() => handleSelect(loc.LocationID)}
                                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors ${value === loc.LocationID ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <span className="truncate">{loc.fullPath}</span>
                                    {value === loc.LocationID && <Check className="h-4 w-4 shrink-0" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-3 text-sm text-gray-400">No storage locations found</div>
                        )}
                    </div>
                </div>
            )}
            {loading && <div className="absolute right-8 top-3 text-xs text-gray-400">Loading...</div>}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    )
}
