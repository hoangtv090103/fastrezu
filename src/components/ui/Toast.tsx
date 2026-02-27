"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

export type ToastType = "success" | "error";

interface ToastProps {
  message: string;
  type?: ToastType;
  /** ms, default 3000 */
  duration?: number;
  onDismiss: () => void;
}

export function Toast({
  message,
  type = "success",
  duration = 3000,
  onDismiss,
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // mount → slide in
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // wait for fade-out
    }, duration);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
    };
  }, [duration, onDismiss]);

  const base =
    "fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium transition-all duration-300";
  const variants: Record<ToastType, string> = {
    success: "bg-gray-900 text-white",
    error: "bg-red-600 text-white",
  };
  const icons = {
    success: <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />,
    error: <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${base} ${variants[type]} ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
    >
      <span
        className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${type === "success" ? "bg-green-500" : "bg-red-400"}`}
      >
        {icons[type]}
      </span>
      {message}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity flex items-center justify-center p-1"
        aria-label="Đóng thông báo"
      >
        <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * useToast — simple hook để trigger Toast từ nơi khác
 */
export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const show = (message: string, type: ToastType = "success") =>
    setToast({ message, type });

  const dismiss = () => setToast(null);

  return { toast, show, dismiss };
}
