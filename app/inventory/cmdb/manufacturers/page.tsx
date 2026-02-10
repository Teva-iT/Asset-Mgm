
import { getManufacturers } from "@/app/actions/manufacturer";
import ManufacturerList from "@/components/cmdb/ManufacturerList";

export default async function ManufacturersPage() {
    const manufacturers = await getManufacturers();

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <ManufacturerList manufacturers={manufacturers} />
        </div>
    );
}
