import { supabase } from "@/lib/supabase";

export async function getCIById(id: string) {
    try {
        const { data: ci, error } = await supabase
            .from("Asset")
            .select(`
                *,
                AssetModel:ModelID (
                    *,
                    Manufacturer:ManufacturerID (*)
                ),
                Assignment (
                    *,
                    Employee:EmployeeID (*)
                ),
                ScanHistory (*)
            `)
            .eq("AssetID", id)
            .single();

        if (error) throw error;

        // We sort the ScanHistory in JS because PostgREST limits order to top level or needs specific notation.
        if (ci && ci.ScanHistory) {
            ci.ScanHistory.sort((a: any, b: any) => new Date(b.ScannedAt).getTime() - new Date(a.ScannedAt).getTime());
            ci.ScanHistory = ci.ScanHistory.slice(0, 5);
        }

        // Map Assignment to assignments to keep backward compatibility with existing components
        if (ci) {
            (ci as any).assignments = ci.Assignment;
        }

        return ci;
    } catch (error) {
        console.error("Error fetching CI:", error);
        return null;
    }
}
