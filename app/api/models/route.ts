import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        // Try with Series column first (added in recent migration)
        let { data, error } = await supabase
            .from("AssetModel")
            .select("ModelID, Name, ManufacturerID, Category, Series")
            .order("Name");

        // Fallback: Series column might not exist yet
        if (error) {
            const fallback = await supabase
                .from("AssetModel")
                .select("ModelID, Name, ManufacturerID, Category")
                .order("Name");
            if (fallback.error) throw fallback.error;
            data = (fallback.data || []).map(m => ({ ...m, Series: null }));
        }

        return Response.json(data || []);
    } catch (error) {
        console.error("Error fetching models:", error);
        return Response.json([], { status: 500 });
    }
}
