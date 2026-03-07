require('dotenv').config()
const { Client } = require('pg')
const crypto = require('crypto')

async function verifyCascade() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    })

    try {
        await client.connect()
        console.log("Connected to DB.")

        // 1. Get a manufacturer
        const mRes = await client.query('SELECT "ManufacturerID" FROM "Manufacturer" LIMIT 1')
        if (mRes.rows.length === 0) {
            console.error("No manufacturer found. Please seed the database first.")
            return
        }
        const manufacturerId = mRes.rows[0].ManufacturerID

        // 2. Insert a test AssetModel
        const modelId = crypto.randomUUID()
        console.log(`Inserting test model: ${modelId}`)
        await client.query(`
            INSERT INTO "AssetModel" ("ModelID", "Name", "Category", "ManufacturerID", "updatedAt")
            VALUES ($1, $2, $3, $4, NOW())
        `, [modelId, 'Cascade Test Model', 'Test', manufacturerId])

        // 3. Insert a test InventoryRecord
        const recordId = crypto.randomUUID()
        console.log(`Inserting test inventory record: ${recordId}`)
        await client.query(`
            INSERT INTO "InventoryRecord" ("RecordID", "ModelID", "Quantity", "ActionType")
            VALUES ($1, $2, $3, $4)
        `, [recordId, modelId, 10, 'ADD'])

        // 4. Verify record exists
        const check1 = await client.query('SELECT * FROM "InventoryRecord" WHERE "RecordID" = $1', [recordId])
        if (check1.rows.length === 1) {
            console.log("Verified: Inventory record exists.")
        } else {
            console.error("Failed: Inventory record was not inserted.")
            return
        }

        // 5. Delete the AssetModel
        console.log(`Deleting model: ${modelId}`)
        await client.query('DELETE FROM "AssetModel" WHERE "ModelID" = $1', [modelId])

        // 6. Verify record is gone (Cascade check)
        const check2 = await client.query('SELECT * FROM "InventoryRecord" WHERE "RecordID" = $1', [recordId])
        if (check2.rows.length === 0) {
            console.log("SUCCESS: Inventory record was automatically deleted (CASCADE).")
        } else {
            console.error("FAILURE: Inventory record still exists. Cascade delete failed.")
        }

    } catch (err) {
        console.error("Error during verification:", err)
    } finally {
        await client.end()
    }
}

verifyCascade()
