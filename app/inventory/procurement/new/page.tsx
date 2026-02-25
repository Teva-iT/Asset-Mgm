
"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createProcurementRequest } from "@/app/actions/procurement"; // We need to verify this import path/existence
import Link from 'next/link';

// Mock data or fetch via server component wrapper
// For simplicity in this step, we'll assume we fetch vendors/models or just input IDs if not provided.
// Realistically we need a server component to fetch vendors to pick from.
// Let's make this a client component that accepts vendors as props, so we need a parent page.

export default function NewProcurementRequestForm() {
    const searchParams = useSearchParams();
    const modelId = searchParams.get("modelId");
    const fromCi = searchParams.get("fromCi");
    const [note, setNote] = useState("");

    async function handleSubmit(formData: FormData) {
        // Validation and submission
        await createProcurementRequest(formData);
        // Redirect or show success
    }

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Create Procurement Request</h1>
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
                    <select name="vendorId" className="w-full border p-2 rounded">
                        <option value="">Select Vendor (Mock)</option>
                        <option value="v1">Vendor A</option>
                        <option value="v2">Vendor B</option>
                    </select>
                    <p className="text-xs text-muted-foreground">In real app, fetch from /actions/vendors</p>
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
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Link href="/inventory/procurement" className="px-4 py-2 border rounded">Cancel</Link>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Submit Request</button>
                </div>
            </form>
        </div>
    );
}
