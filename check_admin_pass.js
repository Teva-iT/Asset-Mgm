require('dotenv').config()
const { Client } = require('pg')
const bcrypt = require('bcryptjs')

async function runSQL() {
    const client = new Client({
        connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    })
    try {
        await client.connect()

        const res = await client.query('SELECT * FROM "User" WHERE "Username" ILIKE \'admin\' LIMIT 1')
        if (res.rows.length === 0) {
            console.log("Admin user does not exist. Creating admin user...");
            const newHash = await bcrypt.hash("2244", 10);
            await client.query(
                'INSERT INTO "User" ("UserID", "Username", "Email", "Password", "Role", "CreatedAt", "UpdatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW())',
                [Math.random().toString(36).substring(2, 15), 'admin', 'admin@teva', newHash, 'Admin']
            );
            console.log("Admin user created successfully with password 2244.");
            return;
        }
        const user = res.rows[0];
        console.log("Admin exists:", user.Username, "Role:", user.Role);

        const isValid = await bcrypt.compare("2244", user.Password)
        console.log("Does '2244' match stored hash?", isValid);

        if (!isValid) {
            // Generate new hash for 2244
            const newHash = await bcrypt.hash("2244", 10)
            console.log("Creating new hash and updating admin...");
            await client.query('UPDATE "User" SET "Password" = $1 WHERE "UserID" = $2', [newHash, user.UserID]);
            console.log("Password updated successfully to '2244'");
        }
    } catch (err) {
        console.error("Error executing SQL:", err)
    } finally {
        await client.end()
    }
}
runSQL()
