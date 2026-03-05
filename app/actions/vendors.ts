"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function getVendors() {
    const { data, error } = await supabase
        .from("Vendor")
        .select("*")
        .order("Name", { ascending: true });

    if (error) {
        console.error("Error fetching vendors:", error);
        return [];
    }

    return data || [];
}

export async function createVendor(formData: FormData) {
    const name = formData.get("name") as string;
    const contactName = formData.get("contactName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const website = formData.get("website") as string;
    const address = formData.get("address") as string;

    if (!name) {
        return { success: false, error: "Name is required" };
    }

    try {
        const { error } = await supabase.from("Vendor").insert({
            VendorID: crypto.randomUUID(),
            Name: name,
            ContactName: contactName || null,
            Email: email || null,
            Phone: phone || null,
            Website: website || null,
            Address: address || null,
            updatedAt: new Date().toISOString()
        });

        if (error) throw error;

        revalidatePath("/inventory/procurement/vendors");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating vendor:", error);
        return { success: false, error: error.message || "Failed to create vendor" };
    }
}

export async function deleteVendor(vendorId: string) {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    try {
        const { error } = await supabase.from("Vendor").delete().eq("VendorID", vendorId);

        if (error) throw error;

        revalidatePath("/inventory/procurement/vendors");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting vendor:", error);
        return { success: false, error: error.message || "Failed to delete vendor" };
    }
}
