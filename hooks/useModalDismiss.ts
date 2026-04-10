"use client";

import { useEffect, useRef } from "react";
import { useEscapeKey } from "@/hooks/useEscapeKey";

export function useModalDismiss<T extends HTMLElement>(
    onDismiss: () => void,
    isEnabled: boolean = true
) {
    const containerRef = useRef<T | null>(null);

    useEscapeKey(onDismiss, isEnabled);

    useEffect(() => {
        if (!isEnabled) return;

        function hasActiveNativePickerInsideModal() {
            const activeElement = document.activeElement;
            if (!(activeElement instanceof HTMLElement) || !containerRef.current) return false;
            if (!containerRef.current.contains(activeElement)) return false;

            if (activeElement.tagName === "SELECT") return true;

            if (activeElement.tagName === "INPUT") {
                const inputType = activeElement.getAttribute("type");
                return ["date", "time", "datetime-local", "month", "week", "color", "file"].includes(inputType || "");
            }

            return false;
        }

        function handlePointerDown(event: MouseEvent | TouchEvent) {
            const target = event.target as Node | null;
            if (!containerRef.current || !target) return;
            if (hasActiveNativePickerInsideModal()) return;
            if (!containerRef.current.contains(target)) {
                onDismiss();
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("touchstart", handlePointerDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("touchstart", handlePointerDown);
        };
    }, [isEnabled, onDismiss]);

    return containerRef;
}
