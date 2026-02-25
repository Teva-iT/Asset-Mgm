'use client'

import { useState, useRef, useEffect } from 'react'

interface StatusSelectProps {
    value: string
    onChange: (value: string) => void
    statuses: { Name: string, Color: string, Description: string }[]
    placeholder?: string
    className?: string
    loading?: boolean
    allowEmpty?: boolean
}

export default function StatusSelect({ value, onChange, statuses, placeholder = "Select Status", className = "", loading = false, allowEmpty = true }: StatusSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
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

    const handleSelect = (statusName: string) => {
        onChange(statusName)
        setIsOpen(false)
    }

    const selectedName = value || ''
    const selectedColor = statuses.find(s => s.Name === selectedName)?.Color || '#6b7280'

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="filter-control cursor-pointer justify-between"
            >
                {selectedName ? (
                    <>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedColor }} />
                        <span className="text-gray-900 text-sm font-medium ml-2">{selectedName}</span>
                    </>
                ) : (
                    <span className="text-gray-500 text-sm">{placeholder}</span>
                )}

                {/* Chevron */}
                <div className="ml-auto">
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
                    {allowEmpty && (
                        <div
                            onClick={() => handleSelect('')}
                            className={`
                                flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors border-b border-gray-50
                                ${value === '' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}
                            `}
                        >
                            <span className="text-sm">Status: All</span>
                        </div>
                    )}

                    {loading ? (
                        <div className="px-3 py-2 text-gray-500 text-sm italic">Loading statuses...</div>
                    ) : statuses.length > 0 ? (
                        statuses.map((status) => (
                            <div
                                key={status.Name}
                                onClick={() => handleSelect(status.Name)}
                                className={`
                                    flex items-center px-3 py-2 cursor-pointer transition-colors
                                    ${value === status.Name ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}
                                `}
                            >
                                <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: status.Color || '#6b7280' }} />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{status.Name}</span>
                                    {status.Description && <span className="text-xs text-gray-400">{status.Description}</span>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-gray-500 text-sm italic">No statuses found.</div>
                    )}
                </div>
            )}
        </div>
    )
}
