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
        const assetsRes = await supabase.from("Asset").select("ModelID");

        if (modelsRes.error) {
            console.error("Models Error", modelsRes.error);
            throw modelsRes.error;
        }

        const models = modelsRes.data || [];
        const mfrs = mfrsRes.data || [];
        const assets = assetsRes.data || [];

        return models.map((m: any) => {
            const manufacturer = mfrs.find((mfr: any) => mfr.ManufacturerID === m.ManufacturerID) || { Name: 'Unknown' };
            const assetCount = assets.filter((a: any) => a.ModelID === m.ModelID).length;

            return {
                ...m,
                Manufacturer: manufacturer,
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

    if (!name || !manufacturerId || !category) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        const { error } = await supabase.from("AssetModel").update({
            Name: name,
            Series: series,
            ManufacturerID: manufacturerId,
            Category: category,
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

// Delete a model
export async function deleteModel(modelId: string) {
    try {
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
