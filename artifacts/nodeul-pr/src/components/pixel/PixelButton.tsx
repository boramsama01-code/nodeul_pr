import React from "react";
import { cn } from "@/lib/utils";

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {

    const variants: Record<string, string> = {
      primary:   "bg-primary text-white border-primary hover:bg-primary/90",
      secondary: "bg-secondary text-white border-secondary hover:bg-secondary/90",
      danger:    "bg-destructive text-white border-destructive hover:bg-destructive/90",
      success:   "bg-success text-white border-success hover:bg-success/90",
      accent:    "bg-accent text-accent-foreground border-accent hover:bg-accent/90",
      ghost:     "bg-transparent text-foreground border-transparent shadow-none hover:bg-muted",
    };

    const sizes: Record<string, string> = {
      sm: "px-3 py-1 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center",
          "font-pixel-body font-bold tracking-wide",
          "border-2 border-black",
          "shadow-[3px_3px_0_0_#000]",
          "transition-all duration-75 select-none",
          "hover:shadow-[4px_4px_0_0_#000] hover:-translate-x-px hover:-translate-y-px",
          "active:shadow-[0px_0px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
          "disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
PixelButton.displayName = "PixelButton";
