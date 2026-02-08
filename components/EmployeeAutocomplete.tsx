'use client'

import { useState, useEffect, useRef } from 'react'

interface Employee {
    EmployeeID: string
    FirstName: string
    LastName: string
    Email: string
    Department: string
}

interface EmployeeAutocompleteProps {
    onSelect: (employee: Employee | null) => void
    defaultEmployee?: Employee
}

export default function EmployeeAutocomplete({ onSelect, defaultEmployee }: EmployeeAutocompleteProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Employee[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState<Employee | null>(defaultEmployee || null)
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
        const fetchEmployees = async () => {
            if (query.length < 2) {
                setResults([])
                return
            }

            try {
                const res = await fetch(`/api/employees?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    setResults(data)
                    setIsOpen(true)
                }
            } catch (error) {
                console.error('Failed to search employees', error)
            }
        }

        const timeoutId = setTimeout(fetchEmployees, 300)
        return () => clearTimeout(timeoutId)
    }, [query])

    const handleSelect = (employee: Employee) => {
        setSelected(employee)
        onSelect(employee)
        setIsOpen(false)
        setQuery('') // Clear query to show placeholder again
    }

    const handleClear = () => {
        setSelected(null)
        onSelect(null)
        setQuery('')
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={selected ? "Search to change employee..." : "Search by name, email, or department..."}
                    className="input-field w-full pl-10" // Added padding for icon if we had one, but standard is fine
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {results.map((employee) => (
                        <div
                            key={employee.EmployeeID}
                            onClick={() => handleSelect(employee)}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                        >
                            <div className="font-medium text-gray-900">
                                {employee.FirstName} {employee.LastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                                {employee.Department} • {employee.Email}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isOpen && results.length === 0 && query.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg p-3 text-center text-gray-500">
                    No employees found.
                </div>
            )}

            {/* Selected Employee Tag */}
            {selected && (
                <div className="mt-3 p-3 bg-white border border-blue-100 rounded-lg shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-200 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                    <div className="flex items-center gap-3 pl-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                            {selected.FirstName[0]}{selected.LastName[0]}
                        </div>
                        <div>
                            <div className="font-semibold text-gray-800">
                                {selected.FirstName} {selected.LastName}
                            </div>
                            <div className="text-sm text-gray-500">
                                {selected.Department}
                                <span className="mx-1 text-gray-300">|</span>
                                {selected.Email}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Remove assignment"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    )
}
