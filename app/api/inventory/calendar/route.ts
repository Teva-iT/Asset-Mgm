import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function toDateOnly(value: string) {
    return value.split('T')[0]
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json({ error: 'month is required (YYYY-MM)' }, { status: 400 })
    }

    const [yearStr, monthStr] = month.split('-')
    const year = Number(yearStr)
    const monthIndex = Number(monthStr) - 1
    const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0))
    const end = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0))

    try {
        const { data, error } = await supabaseAdmin
            .from('InventoryRecord')
            .select('ActionType, Quantity, PurchaseDate, CreatedAt')
            .gte('CreatedAt', start.toISOString())
            .lt('CreatedAt', end.toISOString())

        if (error) throw error

        const summary: Record<string, { total: number; purchase: number; opening: number }> = {}

        for (const row of data || []) {
            const action = String(row.ActionType || '')
            const qty = Number(row.Quantity || 0)
            if (qty <= 0) continue

            const baseDate = row.PurchaseDate ? new Date(row.PurchaseDate) : new Date(row.CreatedAt)
            const dayKey = toDateOnly(baseDate.toISOString())

            if (!summary[dayKey]) summary[dayKey] = { total: 0, purchase: 0, opening: 0 }

            summary[dayKey].total += qty
            if (action === 'OPENING_STOCK' || action === 'ADJUST_OPENING_STOCK') {
                summary[dayKey].opening += qty
            } else {
                summary[dayKey].purchase += qty
            }
        }

        const days = Object.entries(summary).map(([date, counts]) => ({ date, ...counts }))
        return NextResponse.json({ month, days })
    } catch (err: any) {
        console.error('Failed to load calendar stats:', err)
        return NextResponse.json({ error: err.message || 'Failed to load calendar stats' }, { status: 500 })
    }
}
