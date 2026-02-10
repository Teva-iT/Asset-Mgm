
"use client";

import CreateManufacturerDialog from "./CreateManufacturerDialog";

export default function ManufacturerList({ manufacturers }: { manufacturers: any[] }) {


    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Manufacturers</h1>
                    <p className="text-muted-foreground">
                        Manage device manufacturers and their details.
                    </p>
                </div>
                <CreateManufacturerDialog />
            </div>

            <div className="rounded-md border shadow-sm bg-white">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="h-12 px-4 align-middle font-semibold text-gray-600">Name</th>
                            <th className="h-12 px-4 align-middle font-semibold text-gray-600">Website</th>
                            <th className="h-12 px-4 align-middle font-semibold text-gray-600">Support</th>
                            <th className="h-12 px-4 align-middle font-semibold text-gray-600">Models</th>
                            <th className="h-12 px-4 align-middle font-semibold text-gray-600 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {manufacturers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                    No manufacturers found. Start by adding one.
                                </td>
                            </tr>
                        ) : (
                            manufacturers.map((m) => (
                                <tr key={m.ManufacturerID} className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors last:border-0">
                                    <td className="p-4 font-semibold text-gray-900">{m.Name}</td>
                                    <td className="p-4">
                                        {m.Website ? (
                                            <a href={m.Website} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1">
                                                {m.Website.replace(/^https?:\/\//, '')}
                                            </a>
                                        ) : <span className="text-gray-300">-</span>}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col text-xs space-y-1 text-gray-600">
                                            {m.SupportEmail && <span className="flex items-center gap-1">📧 {m.SupportEmail}</span>}
                                            {m.SupportPhone && <span className="flex items-center gap-1">📞 {m.SupportPhone}</span>}
                                            {!m.SupportEmail && !m.SupportPhone && <span className="text-gray-300">-</span>}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                            {m._count.models} Models
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                                            Edit
                                        </button>
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
