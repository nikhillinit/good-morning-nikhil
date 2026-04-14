"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

export function TelevisionFrame({ children, zoomedIn = false }: { children: ReactNode; zoomedIn?: boolean }) {
  return (
    <div className="flex h-screen-safe w-full items-center justify-center bg-zinc-950 sm:bg-zinc-900 sm:p-8 md:p-12 overflow-hidden" style={{ perspective: "1200px" }}>
      {/* Antigravity Floating TV */}
      <motion.div 
        className="relative flex flex-col sm:flex-row w-full h-full sm:max-h-[85vh] sm:max-w-5xl sm:rounded-[3rem] sm:bg-[#3a2818] sm:p-[24px] sm:border-[4px] border-[#22160d]"
        style={{
          boxShadow: "0 40px 100px -10px rgba(0,0,0,0.8), inset 0 6px 15px rgba(255,255,255,0.1), inset 0 -10px 40px rgba(0,0,0,0.6)",
          rotateX: "var(--tv-rotateX, 2deg)"
        }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        {/* Antennas (Hidden on mobile for space) */}
        <div className="hidden sm:flex absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-16 origin-bottom -z-10 justify-between px-8">
          <div className="w-1.5 h-32 bg-zinc-400 rotate-[-30deg] origin-bottom rounded-t-full shadow-lg" />
          <div className="w-1.5 h-32 bg-zinc-400 rotate-[30deg] origin-bottom rounded-t-full shadow-lg" />
        </div>

        {/* Screen Bezel (Dark Plastic) */}
        <div className="relative flex-1 w-full h-full rounded-none sm:rounded-[2.5rem] bg-black sm:bg-[#1a1c1d] sm:p-[12px] shadow-none sm:shadow-[inset_0_5px_15px_rgba(0,0,0,1)] border-none sm:border sm:border-[#000]">
          {/* Inner Screen - Animates from bounded TV space to Full Screen Viewport */}
          <motion.div 
            layout
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className={
              zoomedIn
                ? "fixed inset-0 z-50 overflow-hidden bg-black flex flex-col pointer-events-auto safe-top safe-bottom"
                : "relative w-full h-full rounded-none sm:rounded-[1.8rem] overflow-hidden bg-black shadow-none sm:shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] flex flex-col pointer-events-auto safe-top safe-bottom"
            }
          >
            {children}
            
            {/* CRT Scanline & Glare (Fades out when zooming into the world) */}
            <motion.div 
              initial={false}
              animate={{ opacity: zoomedIn ? 0 : 1 }}
              transition={{ duration: 0.8 }}
              className="pointer-events-none"
            >
              <div className="hidden sm:block absolute inset-0 pointer-events-none mix-blend-screen opacity-10 bg-[linear-gradient(rgba(255,255,255,0),rgba(255,255,255,0)_50%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.2))] bg-[length:100%_4px]" />
              <div className="hidden sm:block absolute inset-0 pointer-events-none rounded-[1.8rem] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)]" />
            </motion.div>
          </motion.div>
        </div>
        
        {/* TV Control Panel (Hidden on Mobile) */}
        <div className="hidden sm:flex w-28 h-full ml-6 flex-col items-center justify-start pt-8 pb-4 gap-8">
          {/* Speaker Grill */}
          <div className="w-full flex-1 rounded-sm flex flex-col justify-start gap-1 p-2 opacity-60">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="w-full h-[3px] bg-black/80 rounded-full" />
            ))}
          </div>

          {/* Dials */}
          <div className="w-16 h-16 rounded-full bg-[#1a1c1d] shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.1)] border-2 border-[#000] relative flex items-center justify-center">
            <div className="w-1 h-6 bg-white/30 absolute top-1" />
          </div>
          <div className="w-14 h-14 rounded-full bg-[#1a1c1d] shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.1)] border-2 border-[#000] relative flex items-center justify-center">
            <div className="w-1 h-5 bg-white/30 absolute top-1" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
