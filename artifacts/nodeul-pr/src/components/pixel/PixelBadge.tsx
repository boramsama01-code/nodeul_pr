import React from "react";
import { cn } from "@/lib/utils";

interface PixelBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "danger" | "accent" | "alert" | "muted";
}

export const PixelBadge = React.forwardRef<HTMLSpanElement, PixelBadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {

    const variants: Record<string, string> = {
      default:   "bg-muted text-foreground border-black",
      muted:     "bg-muted text-foreground border-black",
      primary:   "bg-primary text-white border-primary",
      secondary: "bg-secondary text-white border-secondary",
      success:   "bg-success text-white border-success",
      danger:    "bg-destructive text-white border-destructive",
      accent:    "bg-accent text-accent-foreground border-accent",
      alert:     "bg-yellow-400 text-black border-yellow-600",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5",
          "font-pixel text-[0.5rem] uppercase tracking-wider",
          "border-2 shadow-[2px_2px_0_0_rgba(0,0,0,0.25)]",
          "whitespace-nowrap select-none",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
PixelBadge.displayName = "PixelBadge";