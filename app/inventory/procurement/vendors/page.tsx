import { getVendors } from "@/app/actions/vendors";
import VendorList from "@/components/procurement/VendorList";

export const metadata = {
    title: "Vendors - Asset Manager",
};

export default async function VendorsPage() {
    const vendors = await getVendors();

    return (
        <div className="flex-1 w-full bg-slate-50 min-h-screen">
            <VendorList vendors={vendors} />
        </div>
    );
}
