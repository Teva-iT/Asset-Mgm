'use client'

import { useState, useEffect, useRef } from 'react'

export interface ADUser {
    username: string
    displayName: string
    email: string
    groups: string[]
}

interface Props {
    onSelect: (user: ADUser | null) => void
}

export default function ReferenceUserAutocomplete({ onSelect }: Props) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<ADUser[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState<ADUser | null>(null)
    const [loading, setLoading] = useState(false)
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
        const fetchUsers = async () => {
            if (query.length < 2) {
                setResults([])
                return
            }

            setLoading(true)
            try {
                const res = await fetch(`/api/ad/users/search?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    setResults(data.users || [])
                    setIsOpen(true)
                }
            } catch (error) {
                console.error('Failed to search AD', error)
            } finally {
                setLoading(false)
            }
        }

        const timeoutId = setTimeout(fetchUsers, 400) // slight debounce
        return () => clearTimeout(timeoutId)
    }, [query])

    const handleSelect = (user: ADUser) => {
        setSelected(user)
        onSelect(user)
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
            <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-200 text-purple-700 font-bold text-sm">
                        {selected.displayName.charAt(0)}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900 leading-tight">
                            {selected.displayName} <span className="text-gray-500 font-mono text-xs ml-1">({selected.username})</span>
                        </div>
                        <div className="text-xs text-gray-600">
                            {selected.email || 'No email'}
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full"
                    title="Clear reference user"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        )
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search AD (e.g., John Doe, jdoe)..."
                    className="w-full form-input py-2 pl-10 pr-4 rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    )}
                </div>
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {results.map((user, index) => (
                        <div
                            key={user.username}
                            onClick={() => handleSelect(user)}
                            className={`p-3 cursor-pointer hover:bg-purple-50 ${index !== results.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                            <div className="font-medium text-gray-900">
                                {user.displayName} <span className="text-gray-500 text-sm">({user.username})</span>
                            </div>
                            <div className="text-sm text-gray-500">
                                {user.email || 'No email provided'} • {user.groups.length} Groups
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isOpen && results.length === 0 && query.length >= 2 && !loading && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-gray-500 text-sm">
                    No AD users found matching "{query}"
                </div>
            )}
        </div>
    )
}
