import { getVendors } from "@/app/actions/vendors";
import NewProcurementForm from "@/components/procurement/NewProcurementForm";

export default async function NewProcurementRequestPage() {
    const vendors = await getVendors();

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Create Procurement Request</h1>
            <NewProcurementForm vendors={vendors} />
        </div>
    );
}
