
import { getAssetModels } from "@/app/actions/models";
import { getManufacturers } from "@/app/actions/manufacturer";
import ModelList from "@/components/cmdb/ModelList";

export const dynamic = 'force-dynamic';

export default async function ModelsPage() {
    // Fetch data in parallel for better performance
    const [models, manufacturers] = await Promise.all([
        getAssetModels(),
        getManufacturers()
    ]);

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <ModelList models={models} manufacturers={manufacturers} />
        </div>
    );
}
