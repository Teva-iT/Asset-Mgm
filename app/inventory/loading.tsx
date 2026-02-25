
import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-96 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="flex items-center space-x-2">
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>

            <div className="rounded-md border bg-white p-8">
                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <p className="text-sm text-muted-foreground animate-pulse">Loading inventory data...</p>
                </div>
                <div className="space-y-4 mt-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-gray-100 animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-[30%] bg-gray-100 rounded animate-pulse" />
                                <div className="h-3 w-[20%] bg-gray-50 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
