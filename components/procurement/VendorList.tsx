"use client";

import CreateVendorDialog from "./CreateVendorDialog";
import { Building2, Mail, Phone, Globe, MapPin, User, Trash2 } from "lucide-react";
import { deleteVendor } from "@/app/actions/vendors";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VendorList({ vendors }: { vendors: any[] }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this vendor? This cannot be undone.")) return;

        setIsDeleting(id);
        const res = await deleteVendor(id);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.error || "Failed to delete vendor");
        }
        setIsDeleting(null);
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-blue-600" />
                        Vendors
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage your suppliers, vendors, and purchasing contacts.
                    </p>
                </div>
                <CreateVendorDialog />
            </div>

            <div className="rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="h-12 px-6 align-middle font-semibold text-gray-700">Vendor Identity</th>
                            <th className="h-12 px-6 align-middle font-semibold text-gray-700">Contact Details</th>
                            <th className="h-12 px-6 align-middle font-semibold text-gray-700">Location</th>
                            <th className="h-12 px-6 align-middle font-semibold text-gray-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {vendors.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-gray-500 bg-gray-50/50">
                                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="font-medium text-gray-900">No vendors found</p>
                                    <p className="text-sm mt-1">Start by adding your first vendor.</p>
                                </td>
                            </tr>
                        ) : (
                            vendors.map((v) => (
                                <tr key={v.VendorID} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="p-6">
                                        <div className="font-bold text-gray-900 text-base">{v.Name}</div>
                                        {v.Website && (
                                            <a href={v.Website} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1 text-xs font-medium">
                                                <Globe className="h-3 w-3" />
                                                {v.Website.replace(/^https?:\/\//, '')}
                                            </a>
                                        )}
                                    </td>
                                    <td className="p-6 min-w-[250px]">
                                        <div className="flex flex-col space-y-2 text-sm text-gray-600">
                                            {v.ContactName && (
                                                <span className="flex items-center gap-2 font-medium text-gray-800">
                                                    <User className="h-4 w-4 text-gray-400" /> {v.ContactName}
                                                </span>
                                            )}
                                            {v.Email && (
                                                <span className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    <a href={`mailto:${v.Email}`} className="hover:text-blue-600 hover:underline">{v.Email}</a>
                                                </span>
                                            )}
                                            {v.Phone && (
                                                <span className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-gray-400" /> {v.Phone}
                                                </span>
                                            )}
                                            {!v.ContactName && !v.Email && !v.Phone && <span className="text-gray-400 italic">No contact info</span>}
                                        </div>
                                    </td>
                                    <td className="p-6 max-w-xs text-gray-600">
                                        {v.Address ? (
                                            <span className="flex items-start gap-2 line-clamp-2">
                                                <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                                                {v.Address}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">No address provided</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(v.VendorID)}
                                                disabled={isDeleting === v.VendorID}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="Delete Vendor"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
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
