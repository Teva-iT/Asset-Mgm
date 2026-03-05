import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        // Fetch models where ReorderLevel > 0
        const { data: models, error } = await supabase
            .from("AssetModel")
            .select("*, Manufacturer:ManufacturerID(Name)")
            .gt("ReorderLevel", 0)
            .order("Name");

        if (error) throw error;

        // Filter and categorize
        const lowStock = (models || []).filter(m => (m.AvailableStock || 0) <= (m.ReorderLevel || 0))
            .map(m => {
                const available = m.AvailableStock || 0;
                const reorder = m.ReorderLevel || 0;

                let status = 'Healthy';
                if (available === 0) status = 'Out of Stock';
                else if (available <= reorder) status = 'Low Stock';

                return {
                    ...m,
                    Status: status
                };
            });

        return NextResponse.json(lowStock);
    } catch (error: any) {
        console.error('Failed to fetch low stock models:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
