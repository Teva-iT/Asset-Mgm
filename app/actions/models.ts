"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// Fetch all models
export async function getAssetModels() {
    try {
        console.log("FETCHING MODELS...");
        const modelsRes = await supabase.from("AssetModel").select("*").order("Name", { ascending: true }).limit(100);
        console.log("MODELS RES:", modelsRes.error, modelsRes.data?.length);

        const mfrsRes = await supabase.from("Manufacturer").select("ManufacturerID, Name");
        const assetsRes = await supabase.from("Asset").select("ModelID, StorageLocationID");
        const invRes = await supabase.from("InventoryRecord").select("ModelID, StorageLocationID");
        const locsRes = await supabase.from("StorageLocation").select("LocationID, Name");

        if (modelsRes.error) {
            console.error("Models Error", modelsRes.error);
            throw modelsRes.error;
        }

        const models = modelsRes.data || [];
        const mfrs = mfrsRes.data || [];
        const assets = assetsRes.data || [];
        const inventory = invRes.data || [];
        const locations = locsRes.data || [];

        // Map location IDs to names
        const locMap: Record<string, string> = {};
        for (const loc of locations) {
            locMap[loc.LocationID] = loc.Name;
        }

        return models.map((m: any) => {
            const manufacturer = mfrs.find((mfr: any) => mfr.ManufacturerID === m.ManufacturerID) || { Name: 'Unknown' };
            const assetList = assets.filter((a: any) => a.ModelID === m.ModelID);
            const assetCount = assetList.length;

            // Use DefaultLocationID if set, otherwise fallback to finding any associated location
            const defaultLocName = m.DefaultLocationID ? locMap[m.DefaultLocationID] : null;

            // Gather all distinct location IDs from both assets and inventory records for this model
            const modelLocIds = new Set<string>();

            if (m.DefaultLocationID) modelLocIds.add(m.DefaultLocationID);

            assetList.forEach((a: any) => {
                if (a.StorageLocationID) modelLocIds.add(a.StorageLocationID);
            });

            inventory.filter((inv: any) => inv.ModelID === m.ModelID).forEach((inv: any) => {
                if (inv.StorageLocationID) modelLocIds.add(inv.StorageLocationID);
            });

            const modelLocationNames = Array.from(modelLocIds)
                .map(id => locMap[id])
                .filter(Boolean);

            return {
                ...m,
                Manufacturer: manufacturer,
                DefaultLocationName: defaultLocName,
                locations: modelLocationNames,
                _count: {
                    assets: assetCount
                }
            };
        });
    } catch (error) {
        console.error("Error fetching models:", error);
        return [];
    }
}

// Duplicate a model
export async function duplicateModel(modelId: string) {
    try {
        const { data: existing, error: fetchError } = await supabase
            .from("AssetModel")
            .select("*")
            .eq("ModelID", modelId)
            .single();

        if (fetchError || !existing) {
            return { success: false, error: "Model not found" };
        }

        const newId = crypto.randomUUID();
        const { error: insertError } = await supabase.from("AssetModel").insert({
            ModelID: newId,
            Name: `${existing.Name} (Copy)`,
            ModelNumber: existing.ModelNumber,
            Category: existing.Category,
            ManufacturerID: existing.ManufacturerID,
            Description: existing.Description,
            ImageURL: existing.ImageURL,
            EOLDate: existing.EOLDate,
            updatedAt: new Date().toISOString()
        });

        if (insertError) throw insertError;

        return { success: true, newModelId: newId };
    } catch (error) {
        console.error("Error duplicating model:", error);
        return { success: false, error: "Failed to duplicate model" };
    }
}

// Create a new model
export async function createModelAction(formData: FormData) {
    const name = formData.get("name")?.toString();
    const manufacturerId = formData.get("manufacturerId")?.toString();
    const category = formData.get("category")?.toString();
    const series = formData.get("series")?.toString() || null;

    if (!name || !manufacturerId || !category) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        const newId = crypto.randomUUID();
        const { error } = await supabase.from("AssetModel").insert({
            ModelID: newId,
            Name: name,
            Series: series,
            ManufacturerID: manufacturerId,
            Category: category,
            Color: formData.get("color")?.toString() || null,
            ImageURL: formData.get("imageUrl")?.toString() || null,
            Status: formData.get("status")?.toString() || null,
            DefaultLocationID: formData.get("defaultLocationId")?.toString() || null,
            updatedAt: new Date().toISOString()
        });

        if (error) {
            console.error("Supabase insert error:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/inventory/cmdb/models");
        return { success: true, newModelId: newId };
    } catch (error: any) {
        console.error("Error creating model:", error);
        return { success: false, error: error.message || "Failed to create model" };
    }
}

// Update an existing model
export async function updateModelAction(modelId: string, formData: FormData) {
    const name = formData.get("name")?.toString();
    const manufacturerId = formData.get("manufacturerId")?.toString();
    const category = formData.get("category")?.toString();
    const series = formData.get("series")?.toString() || null;
    const reorderLevelStr = formData.get("reorderLevel")?.toString();
    const reorderLevel = reorderLevelStr ? Math.max(0, parseInt(reorderLevelStr, 10)) : 0;

    if (!name || !manufacturerId || !category) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        const { error } = await supabase.from("AssetModel").update({
            Name: name,
            Series: series,
            ManufacturerID: manufacturerId,
            Category: category,
            Color: formData.get("color")?.toString() || null,
            ImageURL: formData.get("imageUrl")?.toString() || null,
            Status: formData.get("status")?.toString() || null,
            ReorderLevel: reorderLevel,
            DefaultLocationID: formData.get("defaultLocationId")?.toString() || null,
            updatedAt: new Date().toISOString()
        }).eq('ModelID', modelId);

        if (error) {
            console.error("Supabase update error:", error);
            return { success: false, error: error.message };
        }

        revalidatePath("/inventory/cmdb/models");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating model:", error);
        return { success: false, error: error.message || "Failed to update model" };
    }
}

// Check dependencies before deleting a model
export async function checkModelDependencies(modelId: string) {
    try {
        const { count, error } = await supabase
            .from("Asset")
            .select("*", { count: "exact", head: true })
            .eq("ModelID", modelId);

        if (error) throw error;

        return { success: true, count: count || 0 };
    } catch (error: any) {
        console.error("Error checking model dependencies:", error);
        return { success: false, error: "Failed to check dependencies" };
    }
}

// Delete a model
export async function deleteModel(modelId: string, force: boolean = false) {
    try {
        if (force) {
            // First delete associated assets (InventoryRecords should cascade via DB schema, but we can explicitly delete Assets to be safe as that might be what's blocking)
            const { error: assetError } = await supabase
                .from("Asset")
                .delete()
                .eq("ModelID", modelId);

            if (assetError) {
                console.error("Failed to force delete associated assets:", assetError);
                return { success: false, error: "Failed to delete associated assets during force delete." };
            }
        }

        const { error } = await supabase
            .from("AssetModel")
            .delete()
            .eq("ModelID", modelId);

        if (error) {
            console.error("Supabase delete error:", error);
            // Handling foreign key constraint gracefully
            if (error.code === '23503') {
                return { success: false, error: "Cannot delete model because it is associated with existing assets." };
            }
            return { success: false, error: error.message };
        }

        revalidatePath("/inventory/cmdb/models");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting model:", error);
        return { success: false, error: "Failed to delete model" };
    }
}

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
        const { data: model, error: fetchError } = await supabase
            .from("AssetModel")
            .select("TotalStock, AvailableStock, DefaultLocationID")
            .eq("ModelID", modelId)
            .single();

        if (fetchError || !model) throw new Error("Model not found");

        const newTotalStock = (model.TotalStock || 0) + quantity;
        const newAvailableStock = (model.AvailableStock || 0) + quantity;

        // Use provided location or fall back to model's default
        const effectiveLocationId = storageLocationId || model.DefaultLocationID;

        const { error: updateError } = await supabase
            .from("AssetModel")
            .update({
                TotalStock: newTotalStock,
                AvailableStock: newAvailableStock,
                DefaultLocationID: effectiveLocationId,
                updatedAt: new Date().toISOString()
            })
            .eq("ModelID", modelId);

        if (updateError) throw updateError;

        const { error: recordError } = await supabase
            .from("InventoryRecord")
            .insert({
                RecordID: crypto.randomUUID(),
                ModelID: modelId,
                Quantity: quantity,
                ActionType: "ADD",
                PurchaseDate: purchaseDate,
                StorageLocationID: effectiveLocationId,
                Notes: notes,
                CreatedAt: new Date().toISOString()
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

export async function adjustStockAction(formData: FormData) {
    const modelId = formData.get("modelId")?.toString();
    const currentStockStr = formData.get("currentStock")?.toString();
    const newStockStr = formData.get("newStock")?.toString();
    const differenceStr = formData.get("difference")?.toString();
    const storageLocationId = formData.get("storageLocationId")?.toString();
    const reason = formData.get("reason")?.toString() || "adjustment";
    const notes = formData.get("notes")?.toString() || null;

    if (!modelId || newStockStr === undefined || differenceStr === undefined) {
        return { success: false, error: "Missing required fields" };
    }

    const newStock = parseInt(newStockStr, 10);
    const difference = parseInt(differenceStr, 10);

    if (isNaN(newStock) || newStock < 0) {
        return { success: false, error: "Invalid stock value" };
    }

    try {
        const { data: model, error: fetchError } = await supabase
            .from("AssetModel")
            .select("TotalStock, AvailableStock, AssignedStock, DefaultLocationID")
            .eq("ModelID", modelId)
            .single();

        if (fetchError || !model) throw new Error("Model not found");

        if (difference !== 0) {
            // Only update stock counts when there is an actual change
            const assignedStock = model.AssignedStock || 0;
            const newAvailable = Math.max(0, newStock - assignedStock);

            // Use provided location or fall back to model's default
            const effectiveLocationId = storageLocationId || model.DefaultLocationID;

            const { error: updateError } = await supabase
                .from("AssetModel")
                .update({
                    TotalStock: newStock,
                    AvailableStock: newAvailable,
                    DefaultLocationID: effectiveLocationId,
                    updatedAt: new Date().toISOString()
                })
                .eq("ModelID", modelId);

            if (updateError) throw updateError;
        }

        // Log the adjustment (includes location-only changes)
        const actionType = difference === 0 ? "LOCATION_CHANGE" : "ADJUST";
        const effectiveLocationId = storageLocationId || model.DefaultLocationID;

        await supabase.from("InventoryRecord").insert({
            RecordID: crypto.randomUUID(),
            ModelID: modelId,
            Quantity: difference,
            ActionType: actionType,
            StorageLocationID: effectiveLocationId,
            Notes: `Reason: ${reason}${notes ? ` — ${notes}` : ""}`,
            CreatedAt: new Date().toISOString()
        });

        revalidatePath("/inventory/cmdb/models");
        return { success: true };
    } catch (error: any) {
        console.error("Error adjusting stock:", error);
        return { success: false, error: error.message || "Failed to adjust stock" };
    }
}
