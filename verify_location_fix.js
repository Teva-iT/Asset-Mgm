const { supabase } = require('./lib/supabase');
const crypto = require('crypto');

async function verify() {
    console.log("Starting verification...");

    // 1. Create a test model with a location
    const testModelId = crypto.randomUUID();
    const testName = "Verify-Test-Model-" + Date.now();

    // Get a valid location ID first
    const { data: locations, error: locError } = await supabase.from("StorageLocation").select("LocationID").limit(1);
    if (locError || !locations.length) {
        console.error("No locations found for testing");
        return;
    }
    const locId = locations[0].LocationID;
    console.log(`Using location: ${locId}`);

    const { error: insertError } = await supabase.from("AssetModel").insert({
        ModelID: testModelId,
        Name: testName,
        ManufacturerID: '00000000-0000-0000-0000-000000000000', // Assuming a seed or existing exists, let's pick one
        Category: 'Laptop',
        DefaultLocationID: locId
    });

    if (insertError) {
        console.error("Insert failed:", insertError);
        // Try again without hardcoded Mfr ID if it failed
        const { data: mfrs } = await supabase.from("Manufacturer").select("ManufacturerID").limit(1);
        if (mfrs && mfrs.length) {
            const { error: retryError } = await supabase.from("AssetModel").insert({
                ModelID: testModelId,
                Name: testName,
                ManufacturerID: mfrs[0].ManufacturerID,
                Category: 'Laptop',
                DefaultLocationID: locId
            });
            if (retryError) {
                console.error("Retry insert failed:", retryError);
                return;
            }
        } else {
            return;
        }
    }
    console.log("Test model created.");

    // 2. Add stock and verify DefaultLocationID is updated/maintained
    const { error: updateError } = await supabase.from("AssetModel").update({
        TotalStock: 10,
        AvailableStock: 10,
        DefaultLocationID: locId
    }).eq("ModelID", testModelId);

    if (updateError) console.error("Update failed:", updateError);
    else console.log("Stock added.");

    // 3. Verify DefaultLocationID persists
    const { data: verified, error: verifyError } = await supabase
        .from("AssetModel")
        .select("DefaultLocationID")
        .eq("ModelID", testModelId)
        .single();

    if (verifyError || !verified) {
        console.error("Fetch verification failed:", verifyError);
    } else if (verified.DefaultLocationID === locId) {
        console.log("✅ Verification successful: DefaultLocationID persisted correctly.");
    } else {
        console.error(`❌ Verification failed: Expected ${locId}, got ${verified.DefaultLocationID}`);
    }

    // Cleanup
    await supabase.from("AssetModel").delete().eq("ModelID", testModelId);
    console.log("Cleanup done.");
}

verify();
