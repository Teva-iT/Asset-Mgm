import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { employee_id, start_date, include_access, include_hardware, notes } = body

        // For MVP, we need a user context for "requested_by". Hardcoding or fetching from token if available.
        // In a real app, this comes from the auth session.
        const requested_by = 'System User' // Replace with proper logged-in user logic

        console.log("Creating onboarding request for employee:", employee_id)

        // 1. Create Onboarding Parent Record
        const { data: onboarding, error: onboardingError } = await supabase
            .from('onboarding_requests')
            .insert({
                employee_id,
                requested_by,
                start_date,
                include_access,
                include_hardware,
                notes,
                status: 'Draft'
            })
            .select()
            .single()

        if (onboardingError || !onboarding) {
            console.error("Failed to create onboarding request:", onboardingError)
            return NextResponse.json({ error: 'Failed to create onboarding request' }, { status: 500 })
        }

        const onboardingId = onboarding.id

        // 2. Orchestrate Access Request Calculation
        if (include_access) {
            // Fetch employee data to pre-fill access request
            const { data: employee } = await supabase.from('Employee').select('*').eq('EmployeeID', employee_id).single()
            if (employee) {
                // Auto-create a Draft Access Request linked to this onboarding
                const { error: accessError } = await supabase
                    .from('access_requests')
                    .insert({
                        onboarding_request_id: onboardingId,
                        employee_id: employee_id,
                        first_name: employee.FirstName,
                        last_name: employee.LastName,
                        email: employee.Email || '',
                        request_type: 'Onboarding', // Or 'New' based on the form logic built earlier
                        status: 'Draft',
                        requested_date: new Date().toISOString()
                    })

                if (accessError) console.error("Auto-generation of Access Request failed:", accessError)
            }
        }

        // 3. Orchestrate Hardware Request Calculation
        if (include_hardware) {
            // Auto-create a Draft Hardware Request
            const { error: hardwareError } = await supabase
                .from('hardware_requests')
                .insert({
                    onboarding_request_id: onboardingId,
                    employee_id: employee_id,
                    requested_by,
                    request_type: 'Standard',
                    status: 'Draft'
                })

            if (hardwareError) console.error("Auto-generation of Hardware Request failed:", hardwareError)
        }

        return NextResponse.json({
            success: true,
            onboardingRequestId: onboardingId
        })

    } catch (error) {
        console.error("Onboarding API Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
