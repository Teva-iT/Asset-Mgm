import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params
        const { name } = await req.json()

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
        }

        // 1. Get current type to find old name
        const { data: currentType, error: typeError } = await supabase
            .from("AssetType")
            .select("*")
            .eq("TypeID", id)
            .single();

        if (typeError || !currentType) {
            return NextResponse.json({ error: 'Type not found' }, { status: 404 })
        }

        // 2. Update AssetType record
        const { error: updateError } = await supabase.from("AssetType").update({ Name: name, updatedAt: new Date().toISOString() }).eq("TypeID", id);

        if (updateError) throw updateError;

        // 3. Update all Assets using this type 
        // Only if the name actually changed
        if (currentType.Name !== name) {
            await supabase.from("Asset").update({ AssetType: name }).eq("AssetType", currentType.Name);
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating asset type:', error)
        // Check for unique constraint violation (duplicate name)
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Type name already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update asset type' }, { status: 500 })
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const { id } = params

        const { data: typeToDelete, error: typeError } = await supabase
            .from("AssetType")
            .select("*")
            .eq("TypeID", id)
            .single();

        if (typeError || !typeToDelete) {
            return NextResponse.json({ error: 'Type not found' }, { status: 404 })
        }

        // 1. Check if ANY assets are using this type
        const { count, error: countError } = await supabase
            .from("Asset")
            .select("*", { count: "exact", head: true })
            .eq("AssetType", typeToDelete.Name);

        if (count && count > 0) {
            return NextResponse.json({
                error: `Cannot delete. Used by ${count} asset(s). Please reassign them first.`
            }, { status: 400 })
        }

        // 2. Delete the type
        await supabase.from("AssetType").delete().eq("TypeID", id);

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting asset type:', error)
        return NextResponse.json({ error: 'Failed to delete asset type' }, { status: 500 })
    }
}
