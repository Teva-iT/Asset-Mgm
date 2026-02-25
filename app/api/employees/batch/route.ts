import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { employees } = body

        if (!Array.isArray(employees) || employees.length === 0) {
            return NextResponse.json({ error: 'No employees provided' }, { status: 400 })
        }

        let createdCount = 0

        // Process sequentially to handle slugs and errors gracefully
        for (const emp of employees) {
            // Generate Slug
            let baseSlug = `${emp.FirstName}-${emp.LastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '')
            let slug = baseSlug
            let count = 1

            while (true) {
                const { data: existing } = await supabase.from("Employee").select("EmployeeID").eq("Slug", slug).maybeSingle();
                if (!existing) break
                slug = `${baseSlug}-${count}`
                count++
            }

            const { error: insertError } = await supabase.from("Employee").insert({
                EmployeeID: crypto.randomUUID(),
                FirstName: emp.FirstName,
                LastName: emp.LastName,
                Email: emp.Email,
                Department: emp.Department,
                StartDate: new Date(emp.StartDate).toISOString(),
                Status: 'Active',
                Slug: slug,
                updatedAt: new Date().toISOString()
            });

            if (insertError) throw insertError;

            createdCount++
        }

        return NextResponse.json({ count: createdCount, message: 'Batch import successful' }, { status: 201 })
    } catch (error: any) {
        console.error('Batch import error:', error)
        // Check for specific Postgres errors like unique constraint violation
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Duplicate data found (e.g. Email already exists).' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to import employees' }, { status: 500 })
    }
}
