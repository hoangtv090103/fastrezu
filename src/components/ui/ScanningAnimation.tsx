import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

export default function ScanningAnimation() {
  const { t } = useTranslation();
  const [statusText, setStatusText] = useState("");

  // Animation variants for the scanner bar
  const scannerVariants = {
    animate: {
      top: ["0%", "100%", "0%"],
      transition: {
        duration: 3,
        ease: "linear" as const,
        repeat: Infinity,
      },
    },
  };

  // Animation for the document pulse
  const documentVariants = {
    animate: {
      scale: [1, 1.02, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        ease: "easeInOut" as const,
        repeat: Infinity,
      },
    },
  };

  useEffect(() => {
    // Simulate changing status text
    const statuses = [
      t("checkCV.scanning") || "Scanning document...",
      t("checkCV.analyzing") || "Analyzing keywords...",
      t("checkCV.evaluating") || "Evaluating structure...",
      t("checkCV.calculating") || "Calculating score...",
    ];
    let currentIndex = 0;
    setStatusText(statuses[0]);

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % statuses.length;
      setStatusText(statuses[currentIndex]);
    }, 2000);

    return () => clearInterval(interval);
  }, [t]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Document Container */}
      <motion.div
        className="relative w-48 h-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden mb-8"
        variants={documentVariants}
        animate="animate"
      >
        {/* Mock Document Content */}
        <div className="p-4 space-y-3">
          <div className="w-1/3 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-full h-2 bg-gray-100 rounded" />
          <div className="w-full h-2 bg-gray-100 rounded" />
          <div className="w-2/3 h-2 bg-gray-100 rounded" />

          <div className="mt-6 w-1/4 h-3 bg-gray-200 rounded animate-pulse" />
          <div className="w-full h-2 bg-gray-100 rounded" />
          <div className="w-full h-2 bg-gray-100 rounded" />
          <div className="w-full h-2 bg-gray-100 rounded" />

          <div className="mt-6 w-1/4 h-3 bg-gray-200 rounded animate-pulse" />
          <div className="w-full h-2 bg-gray-100 rounded" />
          <div className="w-full h-2 bg-gray-100 rounded" />
        </div>

        {/* Scanner Bar */}
        <motion.div
          className="absolute left-0 w-full h-1 bg-linear-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          variants={scannerVariants}
          animate="animate"
        />

        {/* Scanner Light Effect */}
        <motion.div
          className="absolute left-0 w-full h-8 bg-linear-to-b from-blue-500/20 to-transparent"
          variants={scannerVariants}
          animate="animate"
        />
      </motion.div>

      {/* Status Text */}
      <motion.div
        key={statusText}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-center"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {statusText}
        </h3>
        <p className="text-gray-500 text-sm">
          {t("common.pleaseWait") || "Please wait a moment..."}
        </p>
      </motion.div>
    </div>
  );
}
