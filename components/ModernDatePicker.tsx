'use client'

import { useState, useRef, useEffect } from 'react'

interface ModernDatePickerProps {
    name?: string
    value?: string
    defaultValue?: string
    onChange?: (e: any) => void
    required?: boolean
    disabled?: boolean
    className?: string
    placeholder?: string
    min?: string
    max?: string
}

export default function ModernDatePicker({
    name, value, defaultValue, onChange, required, disabled, className = "", placeholder = "Select Date", min, max
}: ModernDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Internal state handling
    const initialDateStr = value || defaultValue
    const [selectedDate, setSelectedDate] = useState<Date | null>(
        initialDateStr ? new Date(initialDateStr) : null
    )

    // Sync from props
    useEffect(() => {
        if (value !== undefined) {
            setSelectedDate(value ? new Date(value) : null)
        }
    }, [value])

    const [currentMonth, setCurrentMonth] = useState(selectedDate ? selectedDate.getMonth() : new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(selectedDate ? selectedDate.getFullYear() : new Date().getFullYear())

    const popoverRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay()

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(y => y - 1)
        } else {
            setCurrentMonth(m => m - 1)
        }
    }

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(y => y + 1)
        } else {
            setCurrentMonth(m => m + 1)
        }
    }

    const selectDate = (day: number, e: React.MouseEvent) => {
        e.stopPropagation()
        const d = new Date(Date.UTC(currentYear, currentMonth, day))

        const formatString = [
            d.getUTCFullYear(),
            String(d.getUTCMonth() + 1).padStart(2, '0'),
            String(d.getUTCDate()).padStart(2, '0')
        ].join('-')

        setSelectedDate(new Date(currentYear, currentMonth, day))
        setIsOpen(false)

        if (onChange) {
            onChange({
                target: { name, value: formatString }
            })
        }
    }

    const formattedValue = selectedDate ? [
        selectedDate.getFullYear(),
        String(selectedDate.getMonth() + 1).padStart(2, '0'),
        String(selectedDate.getDate()).padStart(2, '0')
    ].join('-') : ''

    const displayFormat = selectedDate ? selectedDate.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    }) : ''

    return (
        <div className={`relative ${className}`} ref={popoverRef}>
            <input type="hidden" name={name} value={formattedValue} required={required} />

            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`
                    w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm transition-all
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-blue-400 hover:shadow-sm focus:ring-2 focus:ring-blue-500'}
                `}
                style={{ height: '42px' }}
            >
                <span className={selectedDate ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                    {selectedDate ? displayFormat : placeholder}
                </span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-2 top-full left-0 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] p-4 w-[280px] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <button type="button" onClick={handlePrevMonth} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="font-semibold text-gray-800 text-sm tracking-wide">
                            {monthNames[currentMonth]} {currentYear}
                        </div>
                        <button type="button" onClick={handleNextMonth} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-9"></div>
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1
                            const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentMonth && selectedDate?.getFullYear() === currentYear
                            const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear

                            let disabledDay = false
                            if (min || max) {
                                const d = new Date(currentYear, currentMonth, day)
                                d.setHours(0, 0, 0, 0)
                                if (min) {
                                    const minDate = new Date(min)
                                    minDate.setHours(0, 0, 0, 0)
                                    if (d < minDate) disabledDay = true
                                }
                                if (max) {
                                    const maxDate = new Date(max)
                                    maxDate.setHours(0, 0, 0, 0)
                                    if (d > maxDate) disabledDay = true
                                }
                            }

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    disabled={disabledDay}
                                    onClick={(e) => selectDate(day, e)}
                                    className={`
                                        h-9 w-9 mx-auto rounded-full flex items-center justify-center text-sm transition-all focus:outline-none
                                        ${disabledDay
                                            ? 'text-gray-300 cursor-not-allowed opacity-50 bg-transparent'
                                            : isSelected
                                                ? 'bg-blue-600 text-white font-bold shadow-md transform scale-105'
                                                : isToday
                                                    ? 'bg-blue-50 text-blue-600 font-bold hover:bg-blue-100'
                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                                    `}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>
                    {/* iOS style clear/today bottom actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between px-2">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedDate(null); setIsOpen(false); if (onChange) onChange({ target: { name, value: '' } }) }}
                            className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); const today = new Date(); selectDate(today.getDate(), e); setSelectedDate(today); setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); }}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
