// ── TailoredCVTemplateDOCX — Router ───────────────────────────────────────────
// Thin router: routes to the correct DOCX template builder based on templateId.
// Loaded lazily by useDOCXDownload via dynamic import.
// NOT a React component — pure TypeScript.

import { Document } from "docx";
import type { TailoredResumeData, TemplateId, ColorTheme } from "./templates/shared/types";
import { buildClassicDOCX }   from "./templates/classic/ClassicDOCX";
import { buildModernDOCX }    from "./templates/modern/ModernDOCX";
import { buildExecutiveDOCX } from "./templates/executive/ExecutiveDOCX";
import { buildCreativeDOCX }  from "./templates/creative/CreativeDOCX";
import { buildMinimalDOCX }   from "./templates/minimal/MinimalDOCX";

export function buildDOCX(
  data: TailoredResumeData,
  language: "vi" | "en" = "vi",
  templateId: TemplateId = "classic",
  colorTheme: ColorTheme = "blue",
  photoBuffer?: ArrayBuffer
): Document {
  switch (templateId) {
    case "modern":
      return buildModernDOCX(data, language, colorTheme, photoBuffer);
    case "executive":
      return buildExecutiveDOCX(data, language, colorTheme, photoBuffer);
    case "creative":
      return buildCreativeDOCX(data, language, colorTheme, photoBuffer);
    case "minimal":
      return buildMinimalDOCX(data, language, colorTheme);
    default:
      return buildClassicDOCX(data, language, colorTheme);
  }
}
