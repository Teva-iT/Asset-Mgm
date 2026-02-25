'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X, User } from 'lucide-react'

interface Employee {
    EmployeeID: string
    FirstName: string
    LastName: string
    Department: string
    Email?: string
}

interface Props {
    employees: Employee[]
    value: string
    onChange: (id: string, name: string) => void
    placeholder?: string
    required?: boolean
}

export default function EmployeeSearchSelect({ employees, value, onChange, placeholder = 'Search employee...', required }: Props) {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const selectedEmployee = employees.find(e => e.EmployeeID === value)

    const q = query.trim()

    const filtered = q.length === 0 ? [] : employees.filter(e => {
        const ql = q.toLowerCase()
        return (
            e.FirstName.toLowerCase().includes(ql) ||
            e.LastName.toLowerCase().includes(ql) ||
            (e.Email || '').toLowerCase().includes(ql)
        )
    })

    // Group by department
    const byDept: Record<string, Employee[]> = {}
    filtered.forEach(e => {
        if (!byDept[e.Department]) byDept[e.Department] = []
        byDept[e.Department].push(e)
    })

    // Highlight matched text
    function highlight(text: string) {
        if (!q) return <>{text}</>
        const idx = text.toLowerCase().indexOf(q.toLowerCase())
        if (idx === -1) return <>{text}</>
        return (
            <>
                {text.slice(0, idx)}
                <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
                {text.slice(idx + q.length)}
            </>
        )
    }

    function select(emp: Employee) {
        onChange(emp.EmployeeID, `${emp.FirstName} ${emp.LastName}`)
        setQuery('')
        setOpen(false)
    }

    function clear(e: React.MouseEvent) {
        e.stopPropagation()
        onChange('', '')
        setQuery('')
    }

    return (
        <div ref={ref} className="relative">
            {/* Trigger / Input */}
            <div
                onClick={() => setOpen(true)}
                className={`input-field flex items-center gap-2 cursor-pointer transition-all ${open ? 'ring-2 ring-blue-500 border-blue-400' : ''}`}
            >
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                {open ? (
                    <input
                        autoFocus
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={placeholder}
                        className="flex-1 outline-none bg-transparent text-sm text-gray-900 placeholder-gray-400 min-w-0"
                        onClick={e => e.stopPropagation()}
                    />
                ) : (
                    <span className={`flex-1 text-sm truncate ${selectedEmployee ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                        {selectedEmployee
                            ? `${selectedEmployee.FirstName} ${selectedEmployee.LastName}`
                            : placeholder}
                    </span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                    {selectedEmployee && !open && (
                        <button type="button" onClick={clear} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Hidden input for form submission */}
            <input type="hidden" name="EmployeeID" value={value} required={required} />

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                    {q.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                            <Search className="w-5 h-5 mx-auto mb-2 opacity-40" />
                            Start typing to search employees
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-gray-400">
                            <Search className="w-5 h-5 mx-auto mb-2 opacity-40" />
                            No employees match "<strong>{q}</strong>"
                        </div>
                    ) : (
                        Object.entries(byDept).map(([dept, emps]) => (
                            <div key={dept}>
                                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 border-b border-gray-100 sticky top-0">
                                    {dept}
                                </div>
                                {emps.map(emp => {
                                    const isSelected = emp.EmployeeID === value
                                    const fullName = `${emp.FirstName} ${emp.LastName}`
                                    return (
                                        <button
                                            key={emp.EmployeeID}
                                            type="button"
                                            onClick={() => select(emp)}
                                            className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                {emp.FirstName[0]}{emp.LastName[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                                                    {highlight(fullName)}
                                                    {isSelected && <span className="ml-1 text-xs font-normal text-blue-400">✓</span>}
                                                </div>
                                                {emp.Email && (
                                                    <div className="text-xs text-gray-400 truncate">{highlight(emp.Email)}</div>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
