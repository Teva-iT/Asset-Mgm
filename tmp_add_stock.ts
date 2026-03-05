export async function addStockAction(formData: FormData) {
    const modelId = formData.get("modelId")?.toString();
    const quantityStr = formData.get("quantity")?.toString();
    const purchaseDate = formData.get("purchaseDate")?.toString() || null;
    const storageLocationId = formData.get("storageLocationId")?.toString() || null;
    const notes = formData.get("notes")?.toString() || null;

    if (!modelId || !quantityStr) {
        return { success: false, error: "Missing required fields" };
    }

    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity <= 0) {
        return { success: false, error: "Quantity must be a positive integer" };
    }

    try {
        // We do this in two steps or ideally a transaction. Using simple sequential queries.
        // 1. Get current model stock
        const { data: model, error: fetchError } = await supabase
            .from("AssetModel")
            .select("TotalStock, AvailableStock")
            .eq("ModelID", modelId)
            .single();

        if (fetchError || !model) throw new Error("Model not found");

        const newTotalStock = (model.TotalStock || 0) + quantity;
        const newAvailableStock = (model.AvailableStock || 0) + quantity;

        // 2. Update Model stock
        const { error: updateError } = await supabase
            .from("AssetModel")
            .update({
                TotalStock: newTotalStock,
                AvailableStock: newAvailableStock,
                updatedAt: new Date().toISOString()
            })
            .eq("ModelID", modelId);

        if (updateError) throw updateError;

        // 3. Create InventoryRecord
        const { error: recordError } = await supabase
            .from("InventoryRecord")
            .insert({
                RecordID: crypto.randomUUID(),
                ModelID: modelId,
                Quantity: quantity,
                ActionType: "ADD",
                PurchaseDate: purchaseDate,
                StorageLocationID: storageLocationId,
                Notes: notes,
                CreatedAt: new Date().toISOString()
                // CreatedByUserID: could be inferred if we have session context
            });

        if (recordError) {
            console.error("Created stock but failed to log record:", recordError);
        }

        revalidatePath("/inventory/cmdb/models");
        return { success: true };
    } catch (error: any) {
        console.error("Error adding stock:", error);
        return { success: false, error: error.message || "Failed to add stock" };
    }
}
