import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        // In a real app, we'd get the current user ID from auth context
        // For now, we'll fetch the first user as a placeholder if noUserID provided
        const { data: userData } = await supabase.from("User").select("UserID").limit(1).single()
        if (!userData) throw new Error("No users found")

        const { data, error } = await supabase
            .from("InventoryNotificationSetting")
            .select("*")
            .eq("UserID", userData.UserID)
            .single()

        if (error && error.code !== 'PGRST116') throw error // PGRST116 is 'no rows returned'

        return NextResponse.json(data || {
            UserID: userData.UserID,
            EmailEnabled: true,
            SystemEnabled: true,
            AlertFrequency: 'Once',
            Recipients: ''
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const { userId, emailEnabled, systemEnabled, alertFrequency, recipients } = body

        const { data, error } = await supabase
            .from("InventoryNotificationSetting")
            .upsert({
                UserID: userId,
                EmailEnabled: emailEnabled,
                SystemEnabled: systemEnabled,
                AlertFrequency: alertFrequency,
                Recipients: recipients,
                UpdatedAt: new Date().toISOString()
            })
            .select()

        if (error) throw error
        return NextResponse.json(data[0])
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
