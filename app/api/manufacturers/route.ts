import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        const { data, error } = await supabase
            .from("Manufacturer")
            .select("ManufacturerID, Name")
            .order("Name");

        if (error) throw error;

        return Response.json(data || []);
    } catch (error) {
        console.error("Error fetching manufacturers:", error);
        return Response.json([], { status: 500 });
    }
}
