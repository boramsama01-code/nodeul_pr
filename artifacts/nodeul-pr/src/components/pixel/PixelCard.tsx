import React from "react";
import { cn } from "@/lib/utils";

interface PixelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "solid" | "alert";
  padding?: "none" | "sm" | "md" | "lg";
}

export const PixelCard = React.forwardRef<HTMLDivElement, PixelCardProps>(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => {
    
    const variants = {
      default: "bg-card text-card-foreground pixel-border",
      solid: "bg-primary text-primary-foreground pixel-border",
      alert: "bg-destructive text-destructive-foreground pixel-border",
    };

    const paddings = {
      none: "p-0",
      sm: "p-2",
      md: "p-4 md:p-6",
      lg: "p-8 md:p-12",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative block font-pixel-body",
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