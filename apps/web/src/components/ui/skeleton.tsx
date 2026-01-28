import { useEffect } from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

const SHIMMER_STYLE_ID = "skeleton-shimmer-keyframes";

export function Skeleton({ className, ...props }: SkeletonProps) {
    useEffect(() => {
        if (typeof document === "undefined") return;
        if (document.getElementById(SHIMMER_STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = SHIMMER_STYLE_ID;
        style.textContent = `
            @keyframes skeleton-shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }, []);

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-md bg-muted/60",
                className
            )}
            {...props}
        >
            <div
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full animate-[skeleton-shimmer_1.25s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.32),transparent)]"
                style={{ pointerEvents: "none" }}
            />
        </div>
    );
}
