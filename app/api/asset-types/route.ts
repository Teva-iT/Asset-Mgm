import { prisma } from '@/lib/db'
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
    fs.appendFileSync(logPath, `[${timestamp}] ${msg}\n`)
}

export async function GET() {
    log('API /api/asset-types called')
    try {
        log('Attempting to fetch AssetTypes from DB...')
        let types = await prisma.assetType.findMany({
            orderBy: { Name: 'asc' }
        })
        log(`Fetched ${types.length} types.`)

        // Seed if empty
        if (types.length === 0) {
            log('Types empty. Seeding defaults...')
            console.log('Seeding default asset types...')
            await prisma.assetType.createMany({
                data: DEFAULT_TYPES.map(name => ({ Name: name })),
                skipDuplicates: true
            })
            types = await prisma.assetType.findMany({
                orderBy: { Name: 'asc' }
            })
            log(`Seeding complete. New count: ${types.length}`)
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
        const { name } = await req.json()

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
        }

        const newType = await prisma.assetType.create({
            data: { Name: name }
        })

        return NextResponse.json(newType)
    } catch (error) {
        console.error('Error creating asset type:', error)
        return NextResponse.json({ error: 'Failed to create asset type' }, { status: 500 })
    }
}
