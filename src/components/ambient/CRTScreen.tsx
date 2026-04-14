"use client";

import { motion } from "framer-motion";

export function CRTScreen() {
  return (
    <div className="absolute inset-0 z-0 bg-black overflow-hidden flex items-center justify-center">
      {/* The CRT Tube that expands */}
      <motion.div 
        className="relative w-full h-full animate-crt-boot origin-center"
      >
        {/* Phosphor Grid / Scanlines */}
        <div className="crt-scanlines absolute inset-0" />
        
        {/* Heavy CRT Vignette */}
        <div className="crt-vignette absolute inset-0" />

        {/* Subtle noise/grain using pseudo-element style or simple SVG filter, optional */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />

        {/* Cheery HBO-style intro static burst */}
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-color-burn animate-cheery-static z-20" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
      </motion.div>
    </div>
  );
}
