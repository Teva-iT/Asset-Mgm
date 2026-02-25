"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// Fetch CIs with Model and StorageLocation details
export async function getConfigurationItems() {
    try {
        // Fetch assets with model join
        const { data: cis, error } = await supabase
            .from("Asset")
            .select(`
                *,
                AssetModel:ModelID (
                    *,
                    Manufacturer:ManufacturerID (*)
                )
            `)
            .order("createdAt", { ascending: false })
            .limit(100);

        if (error) throw error;

        // Fetch all storage locations separately to avoid PostgREST schema cache issues
        const { data: locations } = await supabase
            .from("StorageLocation")
            .select("LocationID, Name, ParentLocationID");

        const locMap: Record<string, any> = {};
        if (locations) {
            for (const loc of locations) {
                locMap[loc.LocationID] = loc;
            }
        }

        // Merge location data in memory
        return (cis || []).map((ci: any) => {
            if (ci.StorageLocationID && locMap[ci.StorageLocationID]) {
                const loc = locMap[ci.StorageLocationID];
                const parent = loc.ParentLocationID ? locMap[loc.ParentLocationID] : null;
                return {
                    ...ci,
                    StorageLocation: {
                        ...loc,
                        ParentLocation: parent ? { Name: parent.Name } : null
                    }
                };
            }
            return { ...ci, StorageLocation: null };
        });
    } catch (error) {
        console.error("Error fetching CIs:", error);
        return [];
    }
}

// Create a new CI
export async function createConfigurationItem(formData: FormData) {

    const modelId = formData.get("modelId") as string;
    const serialNumber = formData.get("serialNumber") as string;
    const assetTag = formData.get("assetTag") as string;
    const status = formData.get("status") as string;
    const condition = formData.get("condition") as string;
    const location = formData.get("location") as string;

    const storageLocationID = formData.get("storageLocationID") as string;

    if (!modelId || !serialNumber) {
        throw new Error("Model and Serial Number are required");
    }

    try {
        // Check if Serial already exists
        const { data: existing } = await supabase
            .from("Asset")
            .select("AssetID")
            .eq("SerialNumber", serialNumber)
            .single();

        if (existing) {
            return { success: false, error: "Serial Number already exists" };
        }

        const { error } = await supabase.from("Asset").insert({
            AssetID: crypto.randomUUID(), // Manual ID generation for Supabase inserts lacking defaults
            ModelID: modelId,
            SerialNumber: serialNumber,
            AssetTag: assetTag || serialNumber,
            DeviceTag: assetTag || serialNumber,
            Status: status || "Available",
            Condition: condition || "New",
            Location: location || null,
            StorageLocationID: storageLocationID || null,
            updatedAt: new Date().toISOString()
        });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error creating CI:", error);
        return { success: false, error: "Failed to create CI" };
    }
}

// Update an existing CI
export async function updateConfigurationItem(assetId: string, formData: FormData) {
    const modelId = formData.get("modelId") as string;
    const serialNumber = formData.get("serialNumber") as string;
    const assetTag = formData.get("assetTag") as string;
    const status = formData.get("status") as string;
    const condition = formData.get("condition") as string;
    const location = formData.get("location") as string;
    const storageLocationID = formData.get("storageLocationID") as string;

    if (!modelId || !serialNumber) {
        throw new Error("Model and Serial Number are required");
    }

    try {
        // Check if Serial already exists for ANOTHER asset
        const { data: existing } = await supabase
            .from("Asset")
            .select("AssetID")
            .eq("SerialNumber", serialNumber)
            .neq("AssetID", assetId)
            .single();

        if (existing) {
            return { success: false, error: "Serial Number belongs to another asset" };
        }

        const { error } = await supabase.from("Asset").update({
            ModelID: modelId,
            SerialNumber: serialNumber,
            AssetTag: assetTag || serialNumber,
            DeviceTag: assetTag || serialNumber,
            Status: status || "Available",
            Condition: condition || "New",
            Location: location || null,
            StorageLocationID: storageLocationID || null,
            updatedAt: new Date().toISOString()
        }).eq("AssetID", assetId);

        if (error) throw error;
        revalidatePath("/inventory/cmdb/cis");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating CI:", error);
        return { success: false, error: error.message || "Failed to update CI" };
    }
}

// Delete a CI
export async function deleteConfigurationItem(assetId: string) {
    try {
        const { error } = await supabase
            .from("Asset")
            .delete()
            .eq("AssetID", assetId);

        if (error) {
            console.error("Supabase delete error:", error);
            // Handle foreign key constraint if assigned
            if (error.code === '23503') {
                return { success: false, error: "Cannot delete asset because it is currently assigned or linked to other records." };
            }
            return { success: false, error: error.message };
        }

        revalidatePath("/inventory/cmdb/cis");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting CI:", error);
        return { success: false, error: error.message || "Failed to delete CI" };
    }
}

