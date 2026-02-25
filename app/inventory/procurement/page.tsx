
import { getProcurementRequests } from "@/app/actions/procurement";
import Link from "next/link";

export default async function ProcurementPage() {
    const requests = await getProcurementRequests();

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Procurement</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage purchase orders and consumable requests.
                    </p>
                </div>
                <Link href="/inventory/procurement/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    New Request
                </Link>
            </div>

            <div className="rounded-md border bg-white">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="h-12 px-4 font-medium">Request ID</th>
                            <th className="h-12 px-4 font-medium">Vendor</th>
                            <th className="h-12 px-4 font-medium">Status</th>
                            <th className="h-12 px-4 font-medium">Date</th>
                            <th className="h-12 px-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No active requests.</td></tr>
                        ) : (
                            requests.map(r => (
                                <tr key={r.RequestID} className="border-t hover:bg-gray-50">
                                    <td className="p-4 font-mono">{r.RequestID.substring(0, 8)}...</td>
                                    <td className="p-4">{r.Vendor?.Name || "-"}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.Status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            r.Status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                                                r.Status === 'RECEIVED' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                                            }`}>
                                            {r.Status}
                                        </span>
                                    </td>
                                    <td className="p-4">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <button className="text-blue-600 hover:underline">View</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
