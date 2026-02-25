"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// Fetch all manufacturers
export async function getManufacturers() {
    try {
        const { data: manufacturers, error } = await supabase
            .from("Manufacturer")
            .select(`
                *,
                models:AssetModel(count)
            `)
            .order("Name", { ascending: true })
            .limit(100);

        if (error) throw error;

        // Map Supabase count format to match expected structure for components
        return (manufacturers || []).map((m: any) => ({
            ...m,
            _count: {
                models: m.models?.[0]?.count || 0
            }
        }));
    } catch (error) {
        console.error("Error fetching manufacturers:", error);
        return [];
    }
}

// Create a new manufacturer
export async function createManufacturer(formData: FormData) {

    const name = formData.get("name") as string;
    const website = formData.get("website") as string;
    const supportEmail = formData.get("supportEmail") as string;
    const supportPhone = formData.get("supportPhone") as string;

    if (!name) {
        throw new Error("Name is required");
    }

    try {
        const { error } = await supabase.from("Manufacturer").insert({
            ManufacturerID: crypto.randomUUID(),
            Name: name,
            Website: website || null,
            SupportEmail: supportEmail || null,
            SupportPhone: supportPhone || null,
            updatedAt: new Date().toISOString()
        });

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error creating manufacturer:", error);
        return { success: false, error: "Failed to create manufacturer" };
    }
}
