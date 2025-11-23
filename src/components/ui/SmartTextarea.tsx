"use client";

import React from "react";
import AIGlowWrapper from "./AIGlowWrapper";

interface SmartTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isRewriting?: boolean;
}

export default function SmartTextarea({
  isRewriting = false,
  className = "",
  ...props
}: SmartTextareaProps) {
  return (
    <AIGlowWrapper isActive={isRewriting} className="w-full">
      <textarea
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500 ${className}`}
        {...props}
      />
    </AIGlowWrapper>
  );
}
