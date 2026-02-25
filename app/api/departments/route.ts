import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const { data, error } = await supabase
            .from("department")
            .select("departmentid, name")
            .order("name", { ascending: true });

        if (error) throw error;

        const departments = data?.map(d => ({
            DepartmentID: d.departmentid,
            Name: d.name
        })) || [];

        return NextResponse.json(departments)
    } catch (error) {
        console.error('Error fetching departments:', error)
        // Fallback or detailed error
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 })
    }
}
