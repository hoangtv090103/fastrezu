"use client";

import React from "react";
import { TEMPLATE_REGISTRY, TEMPLATE_IDS } from "./templates/index";
import type { TemplateId } from "./templates/shared/types";
import { COLOR_THEMES } from "./templates/shared/types";
import type { ColorTheme } from "./templates/shared/types";
import { useTranslation } from "@/hooks/useTranslation";

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  selectedColor: ColorTheme;
  onTemplateChange: (id: TemplateId) => void;
  onColorChange: (theme: ColorTheme) => void;
}

const COLOR_OPTIONS: { id: ColorTheme; label: string; hex: string }[] = [
  { id: "blue",    label: "Blue",    hex: "#2563eb" },
  { id: "slate",   label: "Slate",   hex: "#475569" },
  { id: "emerald", label: "Emerald", hex: "#059669" },
  { id: "rose",    label: "Rose",    hex: "#e11d48" },
];

const ATS_STARS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "★☆☆☆☆",
  2: "★★☆☆☆",
  3: "★★★☆☆",
  4: "★★★★☆",
  5: "★★★★★",
};

export default function TemplateSelector({
  selectedTemplate,
  selectedColor,
  onTemplateChange,
  onColorChange,
}: TemplateSelectorProps) {
  const { locale } = useTranslation();
  const isVi = locale !== "en";

  return (
    <div style={{ padding: "12px 0 8px" }}>
      {/* ── Template grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        {TEMPLATE_IDS.map((id) => {
          const meta = TEMPLATE_REGISTRY[id];
          const isSelected = id === selectedTemplate;
          const color = COLOR_THEMES[selectedColor].primary;

          return (
            <button
              key={id}
              onClick={() => onTemplateChange(id)}
              title={isVi ? meta.labelVi : meta.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px",
                padding: "8px 4px 7px",
                border: isSelected ? `2px solid ${color}` : "2px solid #e5e7eb",
                borderRadius: "8px",
                background: isSelected ? `${color}10` : "#fff",
                cursor: "pointer",
                transition: "all 0.15s ease",
                position: "relative",
              }}
            >
              {/* Mini template thumbnail */}
              <TemplateThumbnail id={id} color={color} />

              {/* Template name */}
              <span
                style={{
                  fontSize: "9.5px",
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? color : "#374151",
                  lineHeight: 1.2,
                  textAlign: "center",
                }}
              >
                {isVi ? meta.labelVi : meta.label}
              </span>

              {/* ATS stars */}
              <span
                style={{
                  fontSize: "8px",
                  color: isSelected ? color : "#9ca3af",
                  letterSpacing: "-0.5px",
                }}
              >
                {ATS_STARS[meta.atsLevel]}
              </span>

              {/* Photo badge */}
              {meta.supportsPhoto && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    fontSize: "8px",
                    background: "#f3f4f6",
                    borderRadius: "4px",
                    padding: "1px 3px",
                    color: "#6b7280",
                  }}
                >
                  📷
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── ATS Warning ── */}
      {TEMPLATE_REGISTRY[selectedTemplate].atsWarning && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            borderRadius: "8px",
            padding: "8px 12px",
            marginBottom: "12px",
            fontSize: "11px",
            color: "#92400e",
            lineHeight: 1.5,
          }}
        >
          ⚠️{" "}
          {isVi
            ? "Template này có thể bị ATS scan không đầy đủ. Chỉ dùng khi nộp trực tiếp hoặc qua email."
            : "This template may not be fully ATS-compatible. Use only for direct or email submissions."}
        </div>
      )}

      {/* ── Color swatches ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>
          {isVi ? "Màu sắc:" : "Color:"}
        </span>
        <div style={{ display: "flex", gap: "6px" }}>
          {COLOR_OPTIONS.map(({ id, label, hex }) => (
            <button
              key={id}
              onClick={() => onColorChange(id)}
              title={label}
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "50%",
                background: hex,
                border: selectedColor === id ? "3px solid #111827" : "2px solid transparent",
                outline: selectedColor === id ? `2px solid ${hex}` : "none",
                outlineOffset: "1px",
                cursor: "pointer",
                transition: "all 0.1s ease",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Mini SVG thumbnails ────────────────────────────────────────────────────────

function TemplateThumbnail({ id, color }: { id: TemplateId; color: string }) {
  const w = 56;
  const h = 72;

  switch (id) {
    case "classic":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
          <rect width={w} height={h} rx="3" fill="#f9fafb" />
          {/* Centered header lines */}
          <rect x="12" y="8" width="32" height="5" rx="1.5" fill={color} opacity="0.9" />
          <rect x="16" y="15" width="24" height="2" rx="1" fill="#d1d5db" />
          <rect x="1" y="21" width="54" height="1" fill={color} />
          {/* Content lines */}
          {[26, 31, 36, 42, 47, 52, 58, 63].map((y, i) => (
            <rect key={i} x="4" y={y} width={i % 3 === 2 ? 28 : 48} height="2" rx="1" fill="#e5e7eb" />
          ))}
        </svg>
      );
    case "modern":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
          <rect width={w} height={h} rx="3" fill="#f9fafb" />
          {/* Sidebar */}
          <rect width="17" height={h} rx="3" fill={color} opacity="0.85" />
          <rect x="2" y="8" width="13" height="13" rx="6.5" fill="rgba(255,255,255,0.5)" />
          {[24, 30, 36, 43, 49].map((y, i) => (
            <rect key={i} x="2" y={y} width={i % 2 ? 9 : 13} height="2" rx="1" fill="rgba(255,255,255,0.5)" />
          ))}
          {/* Main */}
          {[8, 14, 20, 26, 32, 38, 44, 50, 56, 62].map((y, i) => (
            <rect key={i} x="20" y={y} width={i % 3 === 2 ? 16 : 32} height="2" rx="1" fill="#e5e7eb" />
          ))}
        </svg>
      );
    case "executive":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
          <rect width={w} height={h} rx="3" fill="#f9fafb" />
          {/* Header band */}
          <rect width={w} height="20" rx="3" fill={color} opacity="0.9" />
          <rect x="4" y="6" width="28" height="5" rx="1.5" fill="rgba(255,255,255,0.9)" />
          <rect x="4" y="13" width="40" height="2" rx="1" fill="rgba(255,255,255,0.6)" />
          {/* Content with accent bar */}
          {[26, 32, 38, 44, 50, 56, 62].map((y, i) => (
            <g key={i}>
              <rect x="4" y={y - 1} width="3" height="4" rx="1" fill={color} opacity="0.7" />
              <rect x="9" y={y} width={i % 3 === 0 ? 42 : 30} height="2" rx="1" fill="#e5e7eb" />
            </g>
          ))}
        </svg>
      );
    case "creative":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
          <rect width={w} height={h} rx="3" fill="#f9fafb" />
          {/* Gradient header */}
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2={w} y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor={color} />
              <stop offset="1" stopColor={color} stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <rect width={w} height="22" rx="3" fill="url(#cg)" />
          <circle cx="11" cy="11" r="7" fill="rgba(255,255,255,0.4)" />
          <rect x="22" y="6" width="28" height="4" rx="1.5" fill="rgba(255,255,255,0.9)" />
          <rect x="22" y="14" width="20" height="2" rx="1" fill="rgba(255,255,255,0.6)" />
          {/* Accent bar */}
          <rect width={w} height="3" y="22" fill={color} opacity="0.5" />
          {/* Content */}
          {[30, 36, 42, 48, 54, 60].map((y, i) => (
            <rect key={i} x="4" y={y} width={i % 2 === 0 ? 48 : 32} height="2" rx="1" fill="#e5e7eb" />
          ))}
        </svg>
      );
    case "minimal":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
          <rect width={w} height={h} rx="3" fill="#fff" />
          {/* Name */}
          <rect x="4" y="7" width="30" height="5" rx="1" fill="#374151" opacity="0.8" />
          <rect x="4" y="15" width="46" height="1.5" rx="0.5" fill="#9ca3af" />
          {/* Thin divider */}
          <rect x="4" y="21" width="48" height="0.75" fill="#1a1a1a" />
          {/* Sparse content */}
          {[27, 33, 40, 46, 53, 59, 65].map((y, i) => (
            <rect key={i} x="4" y={y} width={i % 3 === 1 ? 24 : 44} height="1.5" rx="0.5" fill="#d1d5db" />
          ))}
          {/* Thin section lines */}
          {[24, 38, 51].map((y) => (
            <rect key={y} x="4" y={y} width="48" height="0.5" fill="#e5e7eb" />
          ))}
        </svg>
      );
    default:
      return null;
  }
}
