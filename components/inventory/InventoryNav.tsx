
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Database, ShoppingCart, Search } from "lucide-react";

export default function InventoryNav() {
    const pathname = usePathname();

    const navItems = [
        {
            name: "Scan & Lookup",
            href: "/inventory",
            icon: Search,
            exact: true
        },
        {
            name: "CMDB",
            href: "/inventory/cmdb",
            icon: Database,
            items: [
                { name: "Storage Locations", href: "/inventory/storage" },
                { name: "Manufacturers", href: "/inventory/cmdb/manufacturers" },
                { name: "Models", href: "/inventory/cmdb/models" },
                { name: "Hardware Assets", href: "/inventory/cmdb/cis" },
            ]
        },
        {
            name: "Procurement",
            href: "/inventory/procurement",
            icon: ShoppingCart,
            items: [
                { name: "Dashboard", href: "/inventory/procurement" },
                { name: "New Request", href: "/inventory/procurement/new" },
            ]
        }
    ];

    return (
        <aside className="w-64 bg-gray-50 border-r border-gray-200 h-[calc(100vh-64px)] overflow-y-auto hidden md:block">
            <div className="p-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    IT Operations
                </h2>
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isChildActive = item.items?.some(sub => pathname === sub.href || pathname.startsWith(sub.href));
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname.startsWith(item.href) || isChildActive;

                        return (
                            <div key={item.name} className="space-y-1">
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                                        : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.name}
                                </Link>

                                {/* Sub-items if active or child active */}
                                {item.items && (isActive || pathname.startsWith(item.href)) && (
                                    <div className="ml-9 space-y-1 border-l-2 border-gray-200 pl-2">
                                        {item.items.map(sub => {
                                            const isSubActive = pathname === sub.href;
                                            return (
                                                <Link
                                                    key={sub.name}
                                                    href={sub.href}
                                                    className={`block px-2 py-1.5 text-sm rounded ${isSubActive ? "text-blue-700 font-medium bg-blue-50" : "text-gray-600 hover:text-gray-900"
                                                        }`}
                                                >
                                                    {sub.name}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
