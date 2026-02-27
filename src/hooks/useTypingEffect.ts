"use client";

import { useState, useRef, useCallback } from "react";

interface UseTypingEffectOptions {
  /** Speed: ms per character. Default 10 */
  speed?: number;
  /** Callback called after animation completes */
  onComplete?: () => void;
}

/**
 * useTypingEffect — Typewriter animation hook
 *
 * Tái sử dụng được mọi nơi cần hiệu ứng "AI đang gõ" khi replace text.
 *
 * Usage:
 * ```tsx
 * const { displayText, isTyping, startTyping } = useTypingEffect(setText);
 * // Khi nhận được text từ AI:
 * await startTyping(aiResult);
 * ```
 */
export function useTypingEffect(
  onTextChange: (text: string) => void,
  options: UseTypingEffectOptions = {}
) {
  const { speed = 10, onComplete } = options;
  const [isTyping, setIsTyping] = useState(false);
  const animFrameRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  /** Cancel any in-progress animation */
  const cancelTyping = useCallback(() => {
    abortRef.current = true;
    if (animFrameRef.current) {
      clearTimeout(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsTyping(false);
  }, []);

  /**
   * Start typing animation.
   * Clears existing content first, then types character by character.
   */
  const startTyping = useCallback(
    (fullText: string) => {
      // Cancel any previous animation
      cancelTyping();
      abortRef.current = false;

      setIsTyping(true);
      onTextChange(""); // Clear existing text

      let i = 0;

      function typeNext() {
        if (abortRef.current) return;
        if (i >= fullText.length) {
          setIsTyping(false);
          onComplete?.();
          return;
        }

        // Type multiple chars per tick for longer texts (progressive speedup)
        const charsPerTick = fullText.length > 300 ? 3 : 1;
        const chunk = fullText.slice(i, i + charsPerTick);
        i += charsPerTick;

        onTextChange(fullText.slice(0, i));

        animFrameRef.current = setTimeout(typeNext, speed);
      }

      // Small initial delay so the glow appears before text starts
      animFrameRef.current = setTimeout(typeNext, 150);
    },
    [speed, onComplete, cancelTyping, onTextChange]
  );

  return { isTyping, startTyping, cancelTyping };
}
