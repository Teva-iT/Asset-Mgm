'use client'

import { useState, useRef, useEffect } from 'react'
import DepartmentIcon from './DepartmentIcon'

interface DepartmentSelectProps {
    value: string
    onChange: (value: string) => void
    departments: { DepartmentID: string, Name: string }[]
    placeholder?: string
    className?: string
    loading?: boolean
}

export default function DepartmentSelect({ value, onChange, departments, placeholder = "Select Department", className = "", loading = false }: DepartmentSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

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
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
            setSearchTerm('')
        }
    }, [isOpen])

    const handleSelect = (deptName: string) => {
        onChange(deptName)
        setIsOpen(false)
        setSearchTerm('')
    }

    const selectedName = value || ''

    const filteredDepartments = departments.filter(dept =>
        dept.Name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="filter-control cursor-pointer justify-between bg-white border border-gray-300 rounded-md px-3 py-2 text-sm shadow-sm"
            >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                    {selectedName ? (
                        <>
                            <DepartmentIcon department={selectedName} className="w-4 h-4 text-gray-500 shrink-0" />
                            <span className="text-gray-900 font-medium truncate">{selectedName}</span>
                        </>
                    ) : (
                        <span className="text-gray-500">{placeholder}</span>
                    )}
                </div>

                {/* Chevron */}
                <div className="ml-2 shrink-0">
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-gray-100 shrink-0">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search department..."
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="overflow-y-auto flex-1 pb-1">
                        {/* "All Departments" Option - only show if empty search or matching */}
                        {('all departments'.includes(searchTerm.toLowerCase()) || searchTerm === '') && (
                            <div
                                onClick={() => handleSelect('')}
                                className={`
                                    flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors border-b border-gray-50
                                    ${value === '' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}
                                `}
                            >
                                <span className="text-sm">All Departments</span>
                            </div>
                        )}

                        {loading ? (
                            <div className="px-3 py-2 text-gray-500 text-sm italic">Loading departments...</div>
                        ) : filteredDepartments.length > 0 ? (
                            filteredDepartments.map((dept) => (
                                <div
                                    key={dept.DepartmentID}
                                    onClick={() => handleSelect(dept.Name)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
                                        ${value === dept.Name ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}
                                    `}
                                >
                                    <DepartmentIcon department={dept.Name} className="w-4 h-4 opacity-70" />
                                    <span className="text-sm">{dept.Name}</span>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-6 text-center text-gray-500 text-sm">
                                <p className="mb-1 text-gray-400">No matching departments</p>
                                <p className="text-xs italic text-gray-400">Try checking spelling</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
