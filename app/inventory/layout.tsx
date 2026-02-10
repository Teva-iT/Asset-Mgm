
import InventoryNav from "@/components/inventory/InventoryNav";

export default function InventoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-[calc(100vh-64px)]">
            <InventoryNav />
            <main className="flex-1 overflow-y-auto bg-white/50">
                {children}
            </main>
        </div>
    );
}
