'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

type DaySummary = {
    date: string
    total: number
    purchase: number
    opening: number
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

function formatMonthValue(date: Date) {
    const year = date.getUTCFullYear()
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
    return `${year}-${month}`
}

function getMonthMatrix(year: number, monthIndex: number) {
    const first = new Date(Date.UTC(year, monthIndex, 1))
    const startDay = first.getUTCDay() // 0 Sun
    const start = new Date(Date.UTC(year, monthIndex, 1 - startDay))
    const weeks: Date[][] = []
    for (let w = 0; w < 6; w++) {
        const week: Date[] = []
        for (let d = 0; d < 7; d++) {
            const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + (w * 7 + d)))
            week.push(current)
        }
        weeks.push(week)
    }
    return weeks
}

function dayKey(date: Date) {
    return date.toISOString().split('T')[0]
}

function intensityClass(total: number) {
    if (total >= 20) return 'bg-emerald-600 text-white'
    if (total >= 10) return 'bg-emerald-500 text-white'
    if (total >= 5) return 'bg-emerald-400 text-white'
    if (total >= 1) return 'bg-emerald-200 text-emerald-900'
    return 'bg-gray-50 text-gray-400'
}

export default function InventoryOrderCalendar() {
    const [monthValue, setMonthValue] = useState(() => formatMonthValue(new Date()))
    const [days, setDays] = useState<DaySummary[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/inventory/calendar?month=${monthValue}`)
            .then(res => res.json())
            .then(data => {
                setDays(Array.isArray(data?.days) ? data.days : [])
            })
            .catch(() => setDays([]))
            .finally(() => setLoading(false))
    }, [monthValue])

    const dayMap = useMemo(() => {
        const map = new Map<string, DaySummary>()
        for (const d of days) map.set(d.date, d)
        return map
    }, [days])

    const [yearStr, monthStr] = monthValue.split('-')
    const year = Number(yearStr)
    const monthIndex = Number(monthStr) - 1
    const weeks = useMemo(() => getMonthMatrix(year, monthIndex), [year, monthIndex])
    const selectedSummary = selectedDate ? dayMap.get(selectedDate) : undefined

    function shiftMonth(delta: number) {
        const next = new Date(Date.UTC(year, monthIndex + delta, 1))
        setMonthValue(formatMonthValue(next))
        setSelectedDate(null)
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 w-full max-w-md">
            <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-emerald-500" />
                    <div>
                        <div className="text-sm font-semibold text-gray-900">Inventory Intake</div>
                        <div className="text-[11px] text-gray-500">Purchase + Opening days</div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => shiftMonth(-1)}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="h-4 w-4 text-gray-500" />
                    </button>
                    <select
                        value={monthValue}
                        onChange={(e) => {
                            setMonthValue(e.target.value)
                            setSelectedDate(null)
                        }}
                        className="border border-gray-200 rounded-md px-2 py-1 text-xs"
                    >
                        {Array.from({ length: 24 }).map((_, idx) => {
                            const date = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 12 + idx, 1))
                            const value = formatMonthValue(date)
                            return (
                                <option key={value} value={value}>
                                    {MONTHS[date.getUTCMonth()]} {date.getUTCFullYear()}
                                </option>
                            )
                        })}
                    </select>
                    <button
                        type="button"
                        onClick={() => shiftMonth(1)}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                        aria-label="Next month"
                    >
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-[10px] text-gray-500 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center font-semibold">{day}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {weeks.flat().map((date) => {
                    const key = dayKey(date)
                    const summary = dayMap.get(key)
                    const inMonth = date.getUTCMonth() === monthIndex
                    const total = summary?.total || 0
                    const purchase = summary?.purchase || 0
                    const opening = summary?.opening || 0
                    const isSelected = selectedDate === key
                    const hasPurchase = purchase > 0
                    const hasOpening = opening > 0
                    const highlightClass = !inMonth
                        ? 'bg-gray-50 text-gray-300'
                        : hasPurchase && hasOpening
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                            : hasPurchase
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : hasOpening
                                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                                    : 'bg-white border-gray-200 text-gray-700'
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setSelectedDate(key)}
                            className={`h-10 rounded-md border text-[11px] flex flex-col items-center justify-center gap-1 transition ${highlightClass} ${isSelected ? 'ring-2 ring-emerald-400' : 'hover:border-gray-300'}`}
                        >
                            <div className="font-semibold leading-none">{date.getUTCDate()}</div>
                            <div className="flex items-center gap-1">
                                {hasPurchase && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                {hasOpening && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                                {!hasPurchase && !hasOpening && <span className="h-1.5 w-1.5 rounded-full bg-gray-200" />}
                            </div>
                            {total > 0 && (
                                <div className="text-[10px] text-gray-500">{total}</div>
                            )}
                        </button>
                    )
                })}
            </div>

            <div className="mt-3 flex items-center gap-3 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Purchase</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Opening</span>
            </div>

            <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50/60 p-3 text-xs">
                {selectedDate ? (
                    <div className="flex flex-col gap-2">
                        <div className="font-semibold text-gray-700">
                            {new Date(`${selectedDate}T00:00:00Z`).toLocaleDateString(undefined, {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                                Purchase: {selectedSummary?.purchase || 0}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-700">
                                Opening: {selectedSummary?.opening || 0}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700">
                                Total: {selectedSummary?.total || 0}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-500">Select a day to see totals and colors.</div>
                )}
            </div>

            {loading && (
                <div className="mt-2 text-[11px] text-gray-400">Loading calendar data...</div>
            )}
        </div>
    )
}
