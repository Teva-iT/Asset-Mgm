
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Factory, Globe, Mail, Phone, X } from "lucide-react";
import { createManufacturer } from "@/app/actions/manufacturer";

export default function CreateManufacturerDialog() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setError("");

        try {
            const res = await createManufacturer(formData);
            if (res.success) {
                setOpen(false);
                router.refresh();
            } else {
                setError(res.error || "Failed to create manufacturer");
            }
        } catch (e) {
            setError("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all h-10 px-4 py-2"
            >
                <Plus className="mr-2 h-4 w-4" />
                Add Manufacturer
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[520px] overflow-hidden border border-gray-100 transform transition-all scale-100">

                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div className="flex gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Factory className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Add Manufacturer</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Define a device manufacturer used across CMDB models</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form action={handleSubmit} className="p-6 space-y-8">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                                    {error}
                                </div>
                            )}

                            {/* Section 1: Identity */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Identity</h3>
                                <div className="space-y-4">
                                    <div className="grid gap-1.5">
                                        <label className="text-sm font-semibold text-gray-700">
                                            Manufacturer Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            name="name"
                                            autoFocus
                                            required
                                            placeholder="e.g. Dell, Apple, HP"
                                            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <Globe className="h-3.5 w-3.5 text-gray-400" /> Website
                                        </label>
                                        <input
                                            name="website"
                                            placeholder="https://..."
                                            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Visual Separator */}
                            <div className="border-t border-gray-100"></div>

                            {/* Section 2: Support */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Support Contact</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-1.5">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <Mail className="h-3.5 w-3.5 text-gray-400" /> Support Email
                                        </label>
                                        <input
                                            name="supportEmail"
                                            type="email"
                                            placeholder="support@example.com"
                                            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                                        />
                                    </div>
                                    <div className="grid gap-1.5">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <Phone className="h-3.5 w-3.5 text-gray-400" /> Support Phone
                                        </label>
                                        <input
                                            name="supportPhone"
                                            placeholder="+1 (555) 000-0000"
                                            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* CTA Actions */}
                            <div className="flex justify-end items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "Creating..." : "Create Manufacturer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
