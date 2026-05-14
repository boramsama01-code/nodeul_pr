import React from "react";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

export const Scanlines: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => {
  const isCRTEnabled = useUIStore((state) => state.isCRTEnabled);

  return (
    <div className={cn("relative min-h-screen w-full", isCRTEnabled ? "scanlines" : "", className)}>
      {children}
    </div>
  );
};