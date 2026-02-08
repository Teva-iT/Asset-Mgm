import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

function log(message: string) {
    try {
        const logPath = path.join(process.cwd(), 'server_debug.log')
        const timestamp = new Date().toISOString()
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`)
    } catch (e) {
        // Ignore logging errors
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    try {
        const terms = q ? q.split(/\s+/).filter(Boolean) : []
        const where = terms.length > 0 ? {
            AND: terms.map(term => ({
                OR: [
                    { FirstName: { contains: term, mode: 'insensitive' as const } },
                    { LastName: { contains: term, mode: 'insensitive' as const } },
                    { Email: { contains: term, mode: 'insensitive' as const } },
                    { Department: { contains: term, mode: 'insensitive' as const } },
                ]
            }))
        } : {}

        const employees = await prisma.employee.findMany({
            where,
            orderBy: { LastName: 'asc' },
            take: q ? 10 : undefined, // Limit results for autocomplete
            include: {
                _count: {
                    select: { assignments: { where: { Status: 'Active' } } }
                }
            }
        })
        return NextResponse.json(employees)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }
}


export async function POST(request: Request) {
    try {
        const body = await request.json()
        log(`Received POST request for employee creation: ${JSON.stringify(body)}`)

        // Generate Slug
        let baseSlug = `${body.FirstName}-${body.LastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '')
        let slug = baseSlug
        let count = 1

        while (true) {
            const existing = await prisma.employee.findUnique({
                where: { Slug: slug }
            })
            if (!existing) break
            slug = `${baseSlug}-${count}`
            count++
        }
        log(`Generated slug: ${slug}`)

        const employee = await prisma.employee.create({
            data: {
                FirstName: body.FirstName,
                LastName: body.LastName,
                Email: body.Email,
                Slug: slug,
                Department: body.Department,
                StartDate: new Date(body.StartDate),
                Status: 'Active', // Explicitly set default
            },
        })
        log(`Employee created successfully: ${employee.EmployeeID}`)
        return NextResponse.json(employee, { status: 201 })
    } catch (error: any) {
        log(`Error creating employee: ${error.message}`)
        console.error('Error creating employee:', error)
        return NextResponse.json({ error: error.message || 'Failed to create employee' }, { status: 500 })
    }
}
