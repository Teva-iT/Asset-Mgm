
import { PrismaClient } from '@prisma/client'

// Override env var to force 127.0.0.1
process.env.DATABASE_URL = "postgresql://postgres:2244@127.0.0.1:5432/postgres?schema=public"

const prisma = new PrismaClient()

async function main() {
    console.log('--- DEBUG INFO ---')
    console.log('Using overridden DATABASE_URL:', process.env.DATABASE_URL)
    console.log('---')

    try {
        console.log('Connecting...')
        const count = await prisma.manufacturer.count()
        console.log(`Connected! Manufacturer count: ${count}`)
    } catch (e) {
        console.error('Connection failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
