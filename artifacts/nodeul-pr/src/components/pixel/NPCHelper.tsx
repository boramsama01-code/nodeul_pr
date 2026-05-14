import React, { useEffect, useState } from "react";
import { useUIStore } from "@/store/useUIStore";
import { motion, AnimatePresence } from "framer-motion";
import { PixelCard } from "./PixelCard";
import { PixelButton } from "./PixelButton";

export const NPCHelper: React.FC = () => {
  const { npcMessage, showNPC, toggleNPC } = useUIStore();
  const [displayedMessage, setDisplayedMessage] = useState("");

  // Typewriter effect
  useEffect(() => {
    if (!npcMessage || !showNPC) return;
    
    setDisplayedMessage("");
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedMessage((prev) => prev + npcMessage.charAt(i));
      i++;
      if (i >= npcMessage.length) clearInterval(interval);
    }, 50); // fast JRPG text speed

    return () => clearInterval(interval);
  }, [npcMessage, showNPC]);

  return (
    <AnimatePresence>
      {showNPC && npcMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-6 right-6 z-50 flex items-end gap-2 max-w-sm"
        >
          <div className="flex-1">
            <PixelCard className="relative mb-2 after:content-[''] after:absolute after:bottom-[-8px] after:right-6 after:border-t-8 after:border-t-black after:border-l-8 after:border-l-transparent after:border-r-8 after:border-r-transparent">
              <button 
                onClick={toggleNPC}
                className="absolute -top-3 -right-3 w-6 h-6 bg-destructive text-white pixel-border-sm flex items-center justify-center text-xs pb-1"
                aria-label="Close"
              >
                x
              </button>
              <p className="font-pixel-body text-xl leading-relaxed">
                {displayedMessage}
                <span className="animate-blink inline-block w-2 h-4 bg-black ml-1 align-middle"></span>
              </p>
            </PixelCard>
          </div>
          
          <div className="flex-shrink-0 animate-pixel-bounce">
            <div className="w-16 h-16 bg-white pixel-border flex items-center justify-center text-4xl shadow-md">
              🐸
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};