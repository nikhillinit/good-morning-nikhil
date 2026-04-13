"use client";

import { motion } from "framer-motion";

export function HazeDrift() {
  return (
    <div
      className="pointer-events-none absolute z-[5] overflow-hidden"
      style={{ top: 0, left: 0, right: 0, height: "45%" }}
    >
      <motion.div
        className="absolute"
        style={{
          width: "200%",
          height: "100%",
          opacity: 0.05,
          background: "url(/textures/haze-wisp.png) repeat-x",
          backgroundSize: "50% 100%",
        }}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}
