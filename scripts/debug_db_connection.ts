
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        // Check connection URL (mask password)
        // Prisma client doesn't expose the URL directly in a public API easily without internals, 
        // but we can query current_database()

        const dbName = await prisma.$queryRaw`SELECT current_database();`
        console.log('Connected to database:', dbName)

        // List all tables
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `
        console.log('Tables in public schema:', tables)

    } catch (e) {
        console.error('Error:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
