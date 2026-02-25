import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const skip = (page - 1) * limit

        let selectString = "*, Employee(FirstName, LastName, Email)";
        if (search) {
            selectString = "*, Employee!inner(FirstName, LastName, Email)";
        }

        let queryBuilder = supabase.from("OffboardingChecklist").select(selectString, { count: "exact" });

        if (search) {
            queryBuilder = queryBuilder.or(`FirstName.ilike.%${search}%,LastName.ilike.%${search}%`, { foreignTable: "Employee" });
        }

        if (status && status !== 'All') {
            queryBuilder = queryBuilder.eq('Status', status)
        }

        const { data: checklists, count: total, error } = await queryBuilder
            .order("createdAt", { ascending: false })
            .range(skip, skip + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            data: checklists || [],
            meta: {
                total: total || 0,
                page,
                limit,
                pages: Math.ceil((total || 0) / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching offboarding checklists:', error)
        return NextResponse.json({ error: 'Failed to fetch checklists' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { employeeId, exitDate, language, createdBy, checklistData } = body

        if (!employeeId || !exitDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const newId = crypto.randomUUID();
        const { data: checklist, error } = await supabase.from("OffboardingChecklist").insert({
            ChecklistID: newId,
            EmployeeID: employeeId,
            ExitDate: new Date(exitDate).toISOString(),
            Language: language || 'DE',
            CreatedBy: createdBy,
            Status: 'Draft',
            ChecklistData: checklistData || {},
            updatedAt: new Date().toISOString()
        }).select().single();

        if (error) throw error;

        return NextResponse.json(checklist, { status: 201 })
    } catch (error) {
        console.error('Error creating offboarding checklist:', error)
        return NextResponse.json({ error: 'Failed to create checklist' }, { status: 500 })
    }
}
