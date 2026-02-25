"use server";

import { supabase } from "@/lib/supabase";

export async function getProcurementRequests() {
    try {
        const { data: requests, error } = await supabase
            .from("ProcurementRequest")
            .select(`
                *,
                Vendor:VendorID (*),
                items:ProcurementItem (*)
            `)
            .order("createdAt", { ascending: false });

        if (error) throw error;
        return requests || [];
    } catch (error) {
        console.error("Error fetching procurement requests:", error);
        return [];
    }
}

export async function createProcurementRequest(formData: FormData) {

    const vendorId = formData.get("vendorId") as string;
    const note = formData.get("note") as string;
    // Simplified creation for now

    try {
        const { error } = await supabase.from("ProcurementRequest").insert({
            RequestID: crypto.randomUUID(),
            RequesterUserID: "SYSTEM", // Replace with auth user
            VendorID: vendorId,
            Status: "PENDING",
            Notes: note,
            Currency: "USD", // Example default
            updatedAt: new Date().toISOString()
        });

        if (error) throw error;
        return { success: true };
    } catch (e) {
        return { success: false, error: "Failed" };
    }
}
