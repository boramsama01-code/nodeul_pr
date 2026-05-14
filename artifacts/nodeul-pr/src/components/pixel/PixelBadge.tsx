import React from "react";
import { cn } from "@/lib/utils";

interface PixelBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "danger" | "accent" | "alert";
}

export const PixelBadge = React.forwardRef<HTMLSpanElement, PixelBadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    
    const variants = {
      default: "bg-muted text-muted-foreground",
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      success: "bg-success text-success-foreground",
      danger: "bg-destructive text-destructive-foreground",
      accent: "bg-accent text-accent-foreground",
      alert: "bg-yellow-400 text-black",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5 text-sm uppercase font-pixel-body pixel-border-sm select-none",
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