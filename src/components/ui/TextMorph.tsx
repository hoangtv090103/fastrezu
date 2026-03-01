"use client";

import React, { useState, useEffect, ReactNode } from "react";

interface TextMorphProps {
  children: ReactNode;
  className?: string;
  text?: string; // Optional text source for stable comparison
}

export default function TextMorph({
  children,
  className = "",
  text,
}: TextMorphProps) {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // If text is provided, use it for comparison
    // Otherwise fall back to children comparison (which might be unstable for new object references)
    if (text !== undefined) {
      // We need to store the previous text to compare, but useEffect dependency does that for us
      // If text hasn't changed, do nothing.
      // However, we don't have access to "previous text" easily inside the effect without a ref or relying on the dependency array firing only when it changes.
      // Actually, we can just check if displayChildren is already updated to the new children.
      // But displayChildren is state.
      // Better logic:
      // We want to trigger animation ONLY when `text` changes.
      // But we also need to update `displayChildren` to the new `children`.
    }
  }, [text, children]);

  // Let's rewrite the effect completely.

  // We need a ref to track the previous text to know if it actually changed
  // because useEffect runs if ANY dependency changes.

  // Actually, simpler:
  // If we use `text` as the key for the component in the parent, React handles unmount/mount.
  // But we want a transition.

  // Let's use a ref to track the last stable text.
  const lastTextRef = React.useRef(text);
  const lastChildrenRef = React.useRef(children);

  useEffect(() => {
    const shouldUpdate =
      text !== undefined
        ? text !== lastTextRef.current
        : children !== lastChildrenRef.current;

    if (!shouldUpdate) return;

    // Update refs
    if (text !== undefined) lastTextRef.current = text;
    lastChildrenRef.current = children;

    // Start transition
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsVisible(false);

    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timeout);
  }, [children, text]);

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        className="transition-all duration-300 ease-in-out"
        style={{
          opacity: isVisible ? 1 : 0,
          filter: isVisible ? "blur(0px)" : "blur(4px)",
        }}
      >
        {displayChildren}
      </div>

      {/* Shimmer Overlay */}
      {!isVisible && (
        <div
          className="absolute inset-0 pointer-events-none animate-shimmer"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
            mixBlendMode: "overlay",
          }}
        />
      )}
    </div>
  );
}
