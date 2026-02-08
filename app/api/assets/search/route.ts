import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
        return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    try {
        // Search by Serial Number OR Device Tag OR Asset Name
        const asset = await prisma.asset.findFirst({
            where: {
                OR: [
                    { SerialNumber: { equals: query, mode: 'insensitive' } },
                    { DeviceTag: { equals: query, mode: 'insensitive' } },
                    { AssetName: { contains: query, mode: 'insensitive' } } // Fallback for manual typing of names
                ]
            },
            include: {
                assignments: {
                    where: { Status: 'Active' },
                    include: {
                        Employee: true
                    }
                }
            }
        })

        if (!asset) {
            return NextResponse.json({ found: false })
        }

        return NextResponse.json({ found: true, asset })
    } catch (error) {
        console.error('Search error:', error)
        return NextResponse.json({ error: 'Failed to search asset' }, { status: 500 })
    }
}
