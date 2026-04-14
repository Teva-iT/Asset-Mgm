import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Use admin client to avoid any RLS or anon-key restrictions.
        const { data, error } = await supabaseAdmin
            .from('department')
            .select('departmentid, name')
            .order('name', { ascending: true })

        if (error) {
            // Fallback for legacy schemas that used a capitalized table name.
            const fallback = await supabaseAdmin
                .from('Department')
                .select('departmentid, name')
                .order('name', { ascending: true })

            if (fallback.error) throw fallback.error

            const departments = fallback.data?.map(d => ({
                DepartmentID: d.departmentid,
                Name: d.name,
            })) || []

            return NextResponse.json(departments)
        }

        let departments = data?.map(d => ({
            DepartmentID: d.departmentid,
            Name: d.name,
        })) || []

        if (departments.length === 0) {
            const { data: employeeDepts, error: empError } = await supabaseAdmin
                .from('Employee')
                .select('Department')
                .not('Department', 'is', null)
                .neq('Department', '')
                .limit(5000)

            if (empError) throw empError

            const seen = new Set<string>()
            departments = (employeeDepts || [])
                .map(row => String(row.Department || '').trim())
                .filter(name => name && !seen.has(name) && (seen.add(name), true))
                .sort((a, b) => a.localeCompare(b))
                .map(name => ({
                    DepartmentID: name,
                    Name: name,
                }))
        }

        return NextResponse.json(departments)
    } catch (error) {
        console.error('Error fetching departments:', error)
        // Fallback or detailed error
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
    }
}
