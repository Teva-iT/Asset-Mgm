
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Use raw query to bypass potential Prisma Client schema mismatch (case sensitivity)
        // forcing lowercase table access which we confirmed exists.
        const rawDepartments: any[] = await prisma.$queryRaw`
            SELECT * FROM department ORDER BY name ASC
        `

        // Map lowercase DB columns to the PascalCase expected by frontend
        const departments = rawDepartments.map(d => ({
            DepartmentID: d.departmentid,
            Name: d.name,
            createdAt: d.createdat,
            updatedAt: d.updatedat
        }))

        return NextResponse.json(departments)
    } catch (error) {
        console.error('Error fetching departments:', error)
        // Fallback or detailed error
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
    }
}
