import React from "react";
import { Link } from "wouter";
import { PixelButton } from "@/components/pixel/PixelButton";
import { PixelCard } from "@/components/pixel/PixelCard";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-12 py-12">
      
      {/* Title Section */}
      <div className="text-center space-y-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          <h1 className="text-4xl md:text-6xl font-pixel text-primary leading-tight drop-shadow-[4px_4px_0_#000]">
            노들섬<br/>
            홍보 통합 시스템
          </h1>
        </motion.div>
        <p className="text-xl md:text-2xl font-pixel-body max-w-2xl mx-auto text-muted-foreground bg-white px-4 py-2 pixel-border-sm">
          Nodeul Island PR Management System V1.0
        </p>
      </div>

      {/* Hero Graphic */}
      <motion.div 
        className="w-full max-w-md mx-auto aspect-video bg-secondary pixel-border flex items-center justify-center p-4 relative overflow-hidden"
        animate={{ 
          boxShadow: ["inset -4px -4px 0px 0px rgba(0,0,0,0.2), 0px 0px 0px 4px #000, 0px 0px 0px 0px #1a1aff", "inset -4px -4px 0px 0px rgba(0,0,0,0.2), 0px 0px 0px 4px #000, 0px 0px 20px 5px #1a1aff", "inset -4px -4px 0px 0px rgba(0,0,0,0.2), 0px 0px 0px 4px #000, 0px 0px 0px 0px #1a1aff"] 
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiAvPgo8L3N2Zz4=')]"></div>
        <div className="relative text-center space-y-4 z-10">
          <div className="text-6xl animate-pixel-bounce drop-shadow-[2px_2px_0_#000]">🏝️</div>
          <h2 className="text-2xl font-pixel text-white drop-shadow-[2px_2px_0_#000]">PRESS START</h2>
        </div>
      </motion.div>

      {/* CTA Actions */}
      <div className="flex flex-col sm:flex-row gap-6">
        <Link href="/sign-up">
          <PixelButton size="lg" variant="primary" className="w-full sm:w-auto animate-pulse">
            NEW GAME
          </PixelButton>
        </Link>
        <Link href="/sign-in">
          <PixelButton size="lg" variant="secondary" className="w-full sm:w-auto">
            CONTINUE
          </PixelButton>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-12">
        <PixelCard className="text-center hover:-translate-y-2 transition-transform">
          <div className="text-4xl mb-4">📜</div>
          <h3 className="font-pixel text-lg mb-2">QUEST LOG</h3>
          <p className="font-pixel-body text-muted-foreground">Track your PR promotion requests like RPG quests.</p>
        </PixelCard>
        <PixelCard className="text-center hover:-translate-y-2 transition-transform">
          <div className="text-4xl mb-4">⚔️</div>
          <h3 className="font-pixel text-lg mb-2">ASSET BATTLE</h3>
          <p className="font-pixel-body text-muted-foreground">Upload and revise promotional assets with ease.</p>
        </PixelCard>
        <PixelCard className="text-center hover:-translate-y-2 transition-transform">
          <div className="text-4xl mb-4">👑</div>
          <h3 className="font-pixel text-lg mb-2">ADMIN HUD</h3>
          <p className="font-pixel-body text-muted-foreground">Powerful dashboard for venue managers to control everything.</p>
        </PixelCard>
      </div>
    </div>
  );
}