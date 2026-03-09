"use server";

import { supabase } from "@/lib/supabase";

export async function getStorageLocations() {
    try {
        const { data, error } = await supabase
            .from("StorageLocation")
            .select("*")
            .order("Name", { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching storage locations:", error);
        return [];
    }
}
