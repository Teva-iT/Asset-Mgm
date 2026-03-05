"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createProcurementRequest } from "@/app/actions/procurement";
import Link from 'next/link';
import { useRouter } from "next/navigation";

export default function NewProcurementForm({ vendors }: { vendors: any[] }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const modelId = searchParams.get("modelId");
    const fromCi = searchParams.get("fromCi");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        // Validation and submission
        const result = await createProcurementRequest(formData);
        if (result?.success) {
            router.push("/inventory/procurement");
        } else {
            alert(result?.error || "Failed to create procurement request");
            setIsSubmitting(false);
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            {/* Hidden fields for context */}
            <input type="hidden" name="modelId" value={modelId || ""} />
            <input type="hidden" name="fromCi" value={fromCi || ""} />

            <div className="bg-blue-50 p-4 rounded text-sm mb-4">
                {modelId ? `Ordering for Model ID: ${modelId}` : "General Request"}
                {fromCi && ` (Originated from CI: ${fromCi})`}
            </div>

            <div className="space-y-2">
                <label className="font-medium">Vendor</label>
                <select name="vendorId" className="w-full border p-2 rounded" required>
                    <option value="">Select Vendor</option>
                    {vendors.length > 0 ? (
                        vendors.map(v => (
                            <option key={v.VendorID} value={v.VendorID}>
                                {v.Name}
                            </option>
                        ))
                    ) : (
                        <option value="" disabled>No vendors available</option>
                    )}
                </select>
            </div>

            <div className="space-y-2">
                <label className="font-medium">Details / Items</label>
                <textarea
                    name="note"
                    rows={4}
                    className="w-full border p-2 rounded"
                    placeholder="Describe items to order..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    required
                />
            </div>

            <div className="flex justify-end gap-2 text-sm">
                <Link href="/inventory/procurement" className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 font-medium h-9 flex items-center">Cancel</Link>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium shadow-sm hover:bg-blue-700 h-9 disabled:opacity-50">
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>
            </div>
        </form>
    );
}
