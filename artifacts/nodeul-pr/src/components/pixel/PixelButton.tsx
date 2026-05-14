import React from "react";
import { cn } from "@/lib/utils";

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const PixelButton = React.forwardRef<HTMLButtonElement, PixelButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    
    const variants = {
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-secondary text-secondary-foreground",
      danger: "bg-destructive text-destructive-foreground",
      success: "bg-success text-success-foreground",
      accent: "bg-accent text-accent-foreground",
      ghost: "bg-transparent text-foreground border-transparent box-shadow-none hover:bg-muted",
    };

    const sizes = {
      sm: "px-3 py-1 text-sm pixel-border-sm pixel-hover-glow-sm pixel-press-sm font-pixel-body",
      md: "px-4 py-2 text-base pixel-border pixel-hover-glow pixel-press font-pixel",
      lg: "px-6 py-4 text-xl pixel-border pixel-hover-glow pixel-press font-pixel tracking-widest",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center uppercase transition-transform select-none focus:outline-none focus:ring-4 focus:ring-ring focus:ring-offset-2",
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