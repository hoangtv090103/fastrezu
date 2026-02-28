// ── Template Registry ─────────────────────────────────────────────────────────
// Maps TemplateId → metadata + lazy-loaded component references.
// HTML preview and PDF are imported lazily to keep bundle size small.

import type { TemplateId } from "./shared/types";

export interface TemplateMetadata {
  id: TemplateId;
  label: string;           // Display name
  labelVi: string;         // Vietnamese display name
  layout: "single" | "two-column";
  supportsPhoto: boolean;  // Whether to render personal.photo_url
  atsLevel: 1 | 2 | 3 | 4 | 5;  // 5 = most ATS-friendly
  atsWarning: boolean;     // Show ATS warning in selector
}

export const TEMPLATE_REGISTRY: Record<TemplateId, TemplateMetadata> = {
  classic: {
    id: "classic",
    label: "Classic",
    labelVi: "Cổ điển",
    layout: "single",
    supportsPhoto: false,
    atsLevel: 5,
    atsWarning: false,
  },
  modern: {
    id: "modern",
    label: "Modern",
    labelVi: "Hiện đại",
    layout: "two-column",
    supportsPhoto: true,
    atsLevel: 3,
    atsWarning: true,
  },
  executive: {
    id: "executive",
    label: "Executive",
    labelVi: "Chuyên nghiệp",
    layout: "single",
    supportsPhoto: true,
    atsLevel: 4,
    atsWarning: false,
  },
  creative: {
    id: "creative",
    label: "Creative",
    labelVi: "Sáng tạo",
    layout: "single",
    supportsPhoto: true,
    atsLevel: 2,
    atsWarning: true,
  },
  minimal: {
    id: "minimal",
    label: "Minimal",
    labelVi: "Tối giản",
    layout: "single",
    supportsPhoto: false,
    atsLevel: 5,
    atsWarning: false,
  },
};

export const TEMPLATE_IDS = Object.keys(TEMPLATE_REGISTRY) as TemplateId[];

// ── Dynamic loaders ───────────────────────────────────────────────────────────
// Use these for lazy-loading in TailoredCVPreview and TailoredCVTemplatePDF.

export async function loadPreviewComponent(id: TemplateId) {
  switch (id) {
    case "classic":   return (await import("./classic/ClassicPreview")).default;
    case "modern":    return (await import("./modern/ModernPreview")).default;
    case "executive": return (await import("./executive/ExecutivePreview")).default;
    case "creative":  return (await import("./creative/CreativePreview")).default;
    case "minimal":   return (await import("./minimal/MinimalPreview")).default;
    default:          return (await import("./classic/ClassicPreview")).default;
  }
}

export async function loadPDFComponent(id: TemplateId) {
  switch (id) {
    case "classic":   return (await import("./classic/ClassicPDF")).default;
    case "modern":    return (await import("./modern/ModernPDF")).default;
    case "executive": return (await import("./executive/ExecutivePDF")).default;
    case "creative":  return (await import("./creative/CreativePDF")).default;
    case "minimal":   return (await import("./minimal/MinimalPDF")).default;
    default:          return (await import("./classic/ClassicPDF")).default;
  }
}
