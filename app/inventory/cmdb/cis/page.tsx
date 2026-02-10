
import { getConfigurationItems } from "@/app/actions/ci";
import { getAssetModels } from "@/app/actions/models";
import CIList from "@/components/cmdb/CIList";

export default async function CIsPage() {
    // Fetch data in parallel for better performance
    const [cis, models] = await Promise.all([
        getConfigurationItems(),
        getAssetModels()
    ]);

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <CIList cis={cis} models={models} />
        </div>
    );
}
