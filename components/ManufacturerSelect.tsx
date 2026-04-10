'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Factory, Search } from 'lucide-react'

interface ManufacturerOption {
    ManufacturerID: string
    Name: string
}

interface ManufacturerSelectProps {
    value: string
    onChange: (value: string) => void
    options: ManufacturerOption[]
    placeholder?: string
    className?: string
}

export default function ManufacturerSelect({
    value,
    onChange,
    options,
    placeholder = 'Select Manufacturer',
    className = '',
}: ManufacturerSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    function closeDropdown() {
        setIsOpen(false)
        setQuery('')
        setHighlightedIndex(0)
    }

    function openDropdown() {
        setQuery('')
        setHighlightedIndex(0)
        setIsOpen(true)
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

    const selectedOption = options.find((option) => option.ManufacturerID === value)
    const filteredOptions = options.filter((option) =>
        option.Name.toLowerCase().includes(query.trim().toLowerCase())
    )

    function handleSelect(optionId: string) {
        onChange(optionId)
        closeDropdown()
    }

    function moveHighlight(direction: 1 | -1) {
        if (filteredOptions.length === 0) return

        setHighlightedIndex((current) => {
            const nextIndex = current + direction

            if (nextIndex < 0) return filteredOptions.length - 1
            if (nextIndex >= filteredOptions.length) return 0

            return nextIndex
        })
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement | HTMLButtonElement>) {
        if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            openDropdown()
            return
        }

        if (!isOpen) return

        if (event.key === 'ArrowDown') {
            event.preventDefault()
            moveHighlight(1)
            return
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault()
            moveHighlight(-1)
            return
        }

        if (event.key === 'Enter') {
            event.preventDefault()
            const highlightedOption = filteredOptions[highlightedIndex]
            if (highlightedOption) {
                handleSelect(highlightedOption.ManufacturerID)
            }
            return
        }

        if (event.key === 'Escape') {
            event.preventDefault()
            closeDropdown()
        }
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <button
                type="button"
                onClick={() => {
                    if (isOpen) {
                        closeDropdown()
                    } else {
                        openDropdown()
                    }
                }}
                onKeyDown={handleKeyDown}
                className="flex h-10 w-full items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                {selectedOption ? (
                    <>
                        <Factory className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900">{selectedOption.Name}</span>
                    </>
                ) : (
                    <span className="text-gray-400">{placeholder}</span>
                )}
                <ChevronDown className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value)
                                    setHighlightedIndex(0)
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Search manufacturer..."
                                className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => {
                            const isSelected = value === option.ManufacturerID
                            const isHighlighted = highlightedIndex === filteredOptions.findIndex((item) => item.ManufacturerID === option.ManufacturerID)

                            return (
                                <button
                                    key={option.ManufacturerID}
                                    type="button"
                                    onClick={() => handleSelect(option.ManufacturerID)}
                                    onMouseEnter={() => setHighlightedIndex(filteredOptions.findIndex((item) => item.ManufacturerID === option.ManufacturerID))}
                                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${isSelected ? 'bg-blue-50 text-blue-700' : isHighlighted ? 'bg-gray-50 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <Factory className="h-4 w-4 opacity-70" />
                                    <span className="flex-1 truncate">{option.Name}</span>
                                    {isSelected && <Check className="h-4 w-4" />}
                                </button>
                            )
                        })
                    ) : (
                        <div className="px-3 py-3 text-sm text-gray-400">No manufacturers found</div>
                    )}
                    </div>
                </div>
            )}
        </div>
    )
}
