
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log("Starting verification...")
    const username = `verify_user_${Date.now()}`
    const password = 'TestPassport123!'
    const role = 'ADMIN'

    // 1. Simulate API Call (Create User)
    console.log(`Creating user: ${username}`)
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const user = await prisma.user.create({
            data: {
                Username: username,
                Password: hashedPassword,
                Role: role
            }
        })
        console.log("User created:", user.UserID)

        // 2. Verify Data
        const fetchedUser = await prisma.user.findUnique({
            where: { UserID: user.UserID }
        })

        if (!fetchedUser) {
            console.error("FAILED: User not found in DB")
            return
        }

        if (fetchedUser.Role !== role) {
            console.error(`FAILED: Role mismatch. Expected ${role}, got ${fetchedUser.Role}`)
            return
        }

        // 3. Verify Password Hash
        const match = await bcrypt.compare(password, fetchedUser.Password)
        if (match) {
            console.log("SUCCESS: Password verified correctly against hash.")
        } else {
            console.error("FAILED: Password hash verification failed.")
        }

        // Cleanup
        await prisma.user.delete({ where: { UserID: user.UserID } })
        console.log("Test user cleaned up.")

    } catch (e) {
        console.error("Error during verification:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
