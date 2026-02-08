
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const departments = await prisma.department.findMany({
            orderBy: { Name: 'asc' }
        })
        return NextResponse.json(departments)
    } catch (error) {
        console.error('Error fetching departments:', error)
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
    }
}
