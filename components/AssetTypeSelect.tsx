'use client'

import { useState, useRef, useEffect } from 'react'
import AssetTypeIcon from './AssetTypeIcon'

interface AssetTypeSelectProps {
    value: string
    onChange: (value: string) => void
    options: string[]
    placeholder?: string
    className?: string
}

export default function AssetTypeSelect({ value, onChange, options, placeholder = "Select Type", className = "" }: AssetTypeSelectProps) {
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

    const handleSelect = (option: string) => {
        onChange(option)
        setIsOpen(false)
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="select-field flex items-center gap-3 cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 h-full shadow-sm"
            >
                {value ? (
                    <>
                        <AssetTypeIcon type={value} className="w-5 h-5 text-gray-600" />
                        <span className="text-gray-900">{value}</span>
                    </>
                ) : (
                    <span className="text-gray-400">{placeholder}</span>
                )}

                {/* Chevron Icon */}
                <div className="ml-auto">
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {options.length > 0 ? (
                        <>
                            {/* "All Types" or Clear option if needed? For form usually strictly required, for list maybe clear. 
                                For now, strict selection matching props. */}
                            {options.map((option) => (
                                <div
                                    key={option}
                                    onClick={() => handleSelect(option)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
                                        ${value === option ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}
                                    `}
                                >
                                    <AssetTypeIcon type={option} className="w-5 h-5 opacity-70" />
                                    <span>{option}</span>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="px-3 py-2 text-gray-400 text-sm">No types found</div>
                    )}
                </div>
            )}
        </div>
    )
}
