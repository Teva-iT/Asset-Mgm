import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        const { data: locations, error } = await supabase
            .from("StorageLocation")
            .select("*, ParentLocation:ParentLocationID(Name), Assets:Asset(count)")
            .order("Name", { ascending: true });

        if (error) throw error;

        const mapped = (locations || []).map((loc: any) => ({
            ...loc,
            _count: {
                Assets: loc.Assets?.[0]?.count || 0
            }
        }));

        console.log('API /storage-locations: Fetched', mapped.length, 'locations')
        return NextResponse.json(mapped)
    } catch (error) {
        console.error('API /storage-locations Error:', error)
        return NextResponse.json({ error: 'Failed to fetch storage locations' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { Name, Description, ParentLocationID } = body

        if (!Name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const newId = crypto.randomUUID();
        const { data: location, error } = await supabase.from("StorageLocation").insert({
            LocationID: newId,
            Name,
            Description,
            ParentLocationID: ParentLocationID || null,
            updatedAt: new Date().toISOString()
        }).select().single();

        if (error) throw error;

        return NextResponse.json(location, { status: 201 })
    } catch (error) {
        console.error('Error creating storage location:', error)
        return NextResponse.json({ error: 'Failed to create storage location' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const { LocationID, Name, Description, ParentLocationID } = body

        if (!LocationID || !Name) {
            return NextResponse.json({ error: 'LocationID and Name are required' }, { status: 400 })
        }

        const { data: location, error } = await supabase.from("StorageLocation").update({
            Name,
            Description,
            ParentLocationID: ParentLocationID || null,
            updatedAt: new Date().toISOString()
        }).eq("LocationID", LocationID).select().single();

        if (error) throw error;

        return NextResponse.json(location)
    } catch (error) {
        console.error('Error updating storage location:', error)
        return NextResponse.json({ error: 'Failed to update storage location' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 })
        }

        // Check for dependencies (Assets or SubLocations)
        const { data: location, error: locError } = await supabase
            .from("StorageLocation")
            .select("*, Assets:Asset(count), SubLocations:StorageLocation(count)")
            .eq("LocationID", id)
            .single();

        if (locError || !location) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 })
        }

        const assetCount = location.Assets?.[0]?.count || 0;
        const subLocCount = location.SubLocations?.[0]?.count || 0;

        if (assetCount > 0 || subLocCount > 0) {
            return NextResponse.json({
                error: 'Cannot delete location with associated assets or sub-locations.'
            }, { status: 400 })
        }

        const { error: delError } = await supabase.from("StorageLocation").delete().eq("LocationID", id);

        if (delError) throw delError;

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting storage location:', error)
        return NextResponse.json({ error: 'Failed to delete storage location' }, { status: 500 })
    }
}
