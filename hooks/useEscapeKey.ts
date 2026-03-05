import { useEffect } from "react";

export function useEscapeKey(onEscape: () => void, isEnabled: boolean = true) {
    useEffect(() => {
        if (!isEnabled) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onEscape();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isEnabled, onEscape]);
}
