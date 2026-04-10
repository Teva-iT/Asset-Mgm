"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Building2, Globe, Mail, Phone, MapPin, X, User } from "lucide-react";
import { createVendor } from "@/app/actions/vendors";
import { useModalDismiss } from "@/hooks/useModalDismiss";

export default function CreateVendorDialog() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const modalRef = useModalDismiss<HTMLDivElement>(() => setOpen(false), open);

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true);
        setError("");

        try {
            const res = await createVendor(formData);
            if (res.success) {
                setOpen(false);
                router.refresh();
            } else {
                setError(res.error || "Failed to create vendor");
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
                Add Vendor
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity p-4">
                    <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-[600px] overflow-hidden border border-gray-100 transform transition-all scale-100 max-h-[90vh] flex flex-col">

                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 shrink-0">
                            <div className="flex gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 leading-tight">Add Vendor</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Register a new supplier or vendor for procurement</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="overflow-y-auto p-6">
                            <form id="create-vendor-form" action={handleSubmit} className="space-y-8">
                                {error && (
                                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
                                        {error}
                                    </div>
                                )}

                                {/* Section 1: Identity */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Identity</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-1.5 col-span-2">
                                            <label className="text-sm font-semibold text-gray-700">
                                                Vendor Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                name="name"
                                                autoFocus
                                                required
                                                placeholder="e.g. Amazon Business, CDW"
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                                            />
                                        </div>
                                        <div className="grid gap-1.5 col-span-2">
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

                                {/* Section 2: Contact Person & Details */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Information</h3>

                                    <div className="grid gap-1.5">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <User className="h-3.5 w-3.5 text-gray-400" /> Primary Contact Name
                                        </label>
                                        <input
                                            name="contactName"
                                            placeholder="e.g. John Doe"
                                            className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-1.5">
                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <Mail className="h-3.5 w-3.5 text-gray-400" /> Email
                                            </label>
                                            <input
                                                name="email"
                                                type="email"
                                                placeholder="sales@vendor.com"
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-gray-400" /> Phone
                                            </label>
                                            <input
                                                name="phone"
                                                placeholder="+1 (555) 000-0000"
                                                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5 text-gray-400" /> Physical Address
                                        </label>
                                        <textarea
                                            name="address"
                                            rows={2}
                                            placeholder="123 Corporate Blvd, Suite 100..."
                                            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-300 resize-none"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer (CTA Actions) */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end items-center gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="create-vendor-form"
                                disabled={isSubmitting}
                                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting ? "Saving..." : "Create Vendor"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
