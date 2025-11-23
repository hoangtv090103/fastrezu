"use client";

import React, { ReactNode } from "react";

interface AIGlowWrapperProps {
  children: ReactNode;
  isActive: boolean;
  className?: string;
  id?: string;
}

export default function AIGlowWrapper({
  children,
  isActive,
  className = "",
  id,
}: AIGlowWrapperProps) {
  return (
    <div id={id} className={`relative ${className}`}>
      {/* Glow Effect Container */}
      <div
        className={`absolute -inset-[2px] rounded-lg bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 transition-opacity duration-500 ${
          isActive ? "opacity-100 animate-gradient-xy" : ""
        }`}
        style={{
          filter: "blur(8px)",
          zIndex: 0,
        }}
      />

      {/* Rotating Border Container */}
      <div
        className={`absolute -inset-px rounded-lg bg-linear-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 transition-opacity duration-500 ${
          isActive ? "opacity-100 animate-gradient-xy" : ""
        }`}
        style={{
          zIndex: 0,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 bg-white rounded-lg h-full">{children}</div>
    </div>
  );
}
