"use server";

import { supabase } from "@/lib/supabase";

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
