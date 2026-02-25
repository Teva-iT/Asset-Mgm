import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Default list to seed if empty
const DEFAULT_TYPES = [
    'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse',
    'Printer', 'Scanner', 'Headset', 'Webcam', 'Speaker',
    'Docking Station', 'Mobile', 'Tablet', 'iPhone Charger', 'iPhone Headset',
    'Power Bank', 'Adapter', 'Cable', 'Server', 'Router', 'Switch',
    'Projector', 'TV', 'Furniture', 'Other'
]

export const dynamic = 'force-dynamic'

function log(msg: string) {
    const logPath = path.join(process.cwd(), 'api_debug.log')
    const timestamp = new Date().toISOString()
    try { fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`) } catch (e) { }
}

export async function GET() {
    log('API /api/asset-types called')
    try {
        log('Attempting to fetch AssetTypes from DB...')
        let { data: types, error: fetchError } = await supabase
            .from("AssetType")
            .select("*")
            .order("Name", { ascending: true });

        if (fetchError) throw fetchError;
        log(`Fetched ${types?.length || 0} types.`)

        // Seed if empty
        if (!types || types.length === 0) {
            log('Types empty. Seeding defaults...')
            console.log('Seeding default asset types...')

            const typesToInsert = DEFAULT_TYPES.map(name => ({
                TypeID: crypto.randomUUID(),
                Name: name,
                OwnershipType: 'Individual',
                updatedAt: new Date().toISOString()
            }));

            await supabase.from("AssetType").insert(typesToInsert);

            const { data: newTypes } = await supabase
                .from("AssetType")
                .select("*")
                .order("Name", { ascending: true });

            types = newTypes;
            log(`Seeding complete. New count: ${types?.length || 0}`)
        }

        return NextResponse.json(types)
    } catch (error: any) {
        log(`ERROR: ${error.message}`)
        console.error('Error fetching asset types:', error)
        return NextResponse.json({ error: 'Failed to fetch asset types', details: error.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { name, ownershipType } = await req.json()

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
        }

        const newId = crypto.randomUUID();
        const { error } = await supabase.from("AssetType").insert({
            TypeID: newId,
            Name: name,
            OwnershipType: ownershipType || 'Individual',
            updatedAt: new Date().toISOString()
        });

        if (error) throw error;

        const { data: newType } = await supabase.from("AssetType").select("*").eq("TypeID", newId).single();

        return NextResponse.json(newType)
    } catch (error: any) {
        console.error('Error creating asset type:', error)
        if (error.code === '23505') { // Postgres Unique Constraint mapping
            return NextResponse.json({ error: 'Asset type already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create asset type' }, { status: 500 })
    }
}

