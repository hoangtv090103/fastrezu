"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TextMorphEffectProps {
  text: string;
  isLoading?: boolean;
  className?: string;
}

export default function TextMorphEffect({
  text,
  isLoading = false,
  className = "",
}: TextMorphEffectProps) {
  // Only trigger full remount when loading state changes
  const containerKey = isLoading ? "loading" : "content";

  return (
    <span className={`relative inline-block ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={containerKey}
          layout
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative inline-block"
          transition={{
            layout: { type: "spring", bounce: 0, duration: 0.3 },
          }}
        >
          {/* Render characters with staggered delay */}
          {text.split(" ").map((word, index) => (
            <React.Fragment key={`${word}-${index}`}>
              <motion.span
                className="inline-block relative whitespace-nowrap"
                variants={{
                  initial: {
                    opacity: 0,
                    filter: "blur(4px)",
                    y: 5,
                    color: "transparent",
                  },
                  animate: {
                    opacity: 1,
                    filter: "blur(0px)",
                    y: 0,
                    color: ["#2563eb", "#9333ea", "#db2777", "currentColor"],
                    transition: {
                      duration: 0.4,
                      delay: index * 0.02, // Adjusted delay for words
                      ease: [0.2, 0.65, 0.3, 0.9],
                    },
                  },
                  exit: {
                    opacity: 0,
                    filter: "blur(4px)",
                    y: -5,
                    transition: {
                      duration: 0.2,
                      delay: index * 0.01,
                    },
                  },
                }}
              >
                {word}
                <motion.span
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(90deg, #2563eb, #9333ea, #db2777)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    opacity: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    backgroundPosition: ["0% 50%", "100% 50%"],
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.02,
                    ease: "easeInOut",
                  }}
                >
                  {word}
                </motion.span>
              </motion.span>{" "}
            </React.Fragment>
          ))}
        </motion.span>
      </AnimatePresence>

      {/* Loading State Overlay (Optional) */}
      {isLoading && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center"
        >
          <span className="block w-full h-full animate-pulse bg-gradient-to-r from-transparent via-blue-100/50 to-transparent" />
        </motion.span>
      )}
    </span>
  );
}
