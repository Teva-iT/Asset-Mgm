'use client'

import { useState, useRef, useEffect } from 'react'
import DepartmentIcon from './DepartmentIcon'

interface DepartmentSelectProps {
    value: string
    onChange: (value: string) => void
    departments: { DepartmentID: string, Name: string }[]
    placeholder?: string
    className?: string
}

export default function DepartmentSelect({ value, onChange, departments, placeholder = "Select Department", className = "" }: DepartmentSelectProps) {
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

    const handleSelect = (deptName: string) => {
        onChange(deptName)
        setIsOpen(false)
    }

    const selectedName = value || ''

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="filter-control cursor-pointer justify-between"
            >
                {selectedName ? (
                    <>
                        <DepartmentIcon department={selectedName} className="w-4 h-4 text-gray-600" />
                        <span className="text-gray-900 text-sm font-medium">{selectedName}</span>
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
                    {/* "All Departments" Option */}
                    <div
                        onClick={() => handleSelect('')}
                        className={`
                            flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors border-b border-gray-50
                            ${value === '' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}
                        `}
                    >
                        <span className="text-sm">All Departments</span>
                    </div>

                    {departments.length > 0 ? (
                        departments.map((dept) => (
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
                        <div className="px-3 py-2 text-gray-400 text-sm">Loading...</div>
                    )}
                </div>
            )}
        </div>
    )
}
