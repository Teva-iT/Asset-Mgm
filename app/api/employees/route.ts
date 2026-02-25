import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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
        let queryBuilder = supabase
            .from("Employee")
            .select("*, assignments:Assignment(count)")
            .order("LastName", { ascending: true });

        if (q) {
            queryBuilder = queryBuilder.limit(10);
            const terms = q.split(/\s+/).filter(Boolean);
            terms.forEach(term => {
                queryBuilder = queryBuilder.or(`FirstName.ilike.%${term}%,LastName.ilike.%${term}%,Email.ilike.%${term}%,Department.ilike.%${term}%`);
            });
        }

        const { data: employees, error } = await queryBuilder;

        if (error) throw error;

        const result = (employees || []).map((emp: any) => ({
            ...emp,
            _count: {
                assignments: emp.assignments?.[0]?.count || 0
            }
        }));

        return NextResponse.json(result)
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
            const { data: existing } = await supabase.from("Employee").select("EmployeeID").eq("Slug", slug).maybeSingle();
            if (!existing) break
            slug = `${baseSlug}-${count}`
            count++
        }
        log(`Generated slug: ${slug}`)

        const newEmployeeId = crypto.randomUUID();
        const { error: insertError } = await supabase.from("Employee").insert({
            EmployeeID: newEmployeeId,
            FirstName: body.FirstName,
            LastName: body.LastName,
            Email: body.Email,
            Slug: slug,
            Department: body.Department,
            StartDate: new Date(body.StartDate).toISOString(),
            Status: 'Active', // Explicitly set default
            updatedAt: new Date().toISOString()
        });

        if (insertError) throw insertError;
        log(`Employee created successfully: ${newEmployeeId}`)

        const { data: employee } = await supabase.from("Employee").select("*").eq("EmployeeID", newEmployeeId).single();

        return NextResponse.json(employee, { status: 201 })
    } catch (error: any) {
        log(`Error creating employee: ${error.message}`)
        console.error('Error creating employee:', error)
        return NextResponse.json({ error: error.message || 'Failed to create employee' }, { status: 500 })
    }
}
