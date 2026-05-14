import React from "react";
import { cn } from "@/lib/utils";

interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "solid" | "alert" | "muted";
  padding?: "none" | "sm" | "md" | "lg";
}

export const PixelCard = React.forwardRef<HTMLDivElement, PixelCardProps>(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => {

    const variants: Record<string, string> = {
      default: "bg-white text-foreground border-black shadow-[4px_4px_0_0_#000]",
      solid:   "bg-primary text-white border-primary/80 shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]",
      alert:   "bg-destructive/10 text-destructive border-destructive shadow-[4px_4px_0_0_rgba(0,0,0,0.15)]",
      muted:   "bg-muted text-foreground border-black shadow-[4px_4px_0_0_#000]",
    };

    const paddings: Record<string, string> = {
      none: "p-0",
      sm:   "p-3",
      md:   "p-4 sm:p-5",
      lg:   "p-6 sm:p-8",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative border-2 font-pixel-body",
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
PixelCard.displayName = "PixelCard";
