
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { employees } = body

        if (!Array.isArray(employees) || employees.length === 0) {
            return NextResponse.json({ error: 'No employees provided' }, { status: 400 })
        }

        let createdCount = 0

        // Process sequentially to handle slugs and errors gracefully
        // Or use transaction for all-or-nothing. User asked for "Batch". 
        // Given the UI shows "Import X valid employees", generally we expect them to succeed.
        // Let's use a transaction to be safe.

        await prisma.$transaction(async (tx) => {
            for (const emp of employees) {
                // Generate Slug
                let baseSlug = `${emp.FirstName}-${emp.LastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '')
                let slug = baseSlug
                let count = 1

                while (true) {
                    const existing = await tx.employee.findUnique({ where: { Slug: slug } })
                    if (!existing) break
                    slug = `${baseSlug}-${count}`
                    count++
                }

                await tx.employee.create({
                    data: {
                        FirstName: emp.FirstName,
                        LastName: emp.LastName,
                        Email: emp.Email,
                        Department: emp.Department,
                        StartDate: new Date(emp.StartDate),
                        Status: 'Active',
                        Slug: slug
                    }
                })
                createdCount++
            }
        })

        return NextResponse.json({ count: createdCount, message: 'Batch import successful' }, { status: 201 })
    } catch (error: any) {
        console.error('Batch import error:', error)
        // Check for specific Prisma errors like unique constraint violation
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Duplicate data found (e.g. Email already exists).' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to import employees' }, { status: 500 })
    }
}
