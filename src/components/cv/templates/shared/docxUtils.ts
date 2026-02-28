// ── DOCX Shared Utilities ─────────────────────────────────────────────────────
// Pure helpers for all 5 DOCX template builders. No React/JSX.

import {
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
  convertInchesToTwip,
  ExternalHyperlink,
} from "docx";
import { parseBullets, dateRange } from "./utils";

// A4 page width (8.27in) minus 0.9in margins on each side = 6.47in usable
const PAGE_WIDTH_TWIP = convertInchesToTwip(6.47);

/** "#2563eb" → "2563EB" (docx color strings are uppercase hex without #) */
export function hexToDocxColor(hex: string): string {
  return hex.replace("#", "").toUpperCase();
}

/** Empty spacer paragraph */
export function spacer(spacingAfter = 80): Paragraph {
  return new Paragraph({ spacing: { after: spacingAfter }, children: [] });
}

/**
 * Section heading: ALLCAPS bold text in primary color with a bottom border line.
 * Used by Classic, Executive body, Creative body, Minimal.
 */
export function sectionHeading(label: string, primaryColor: string): Paragraph {
  const color = hexToDocxColor(primaryColor);
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color },
    },
    children: [
      new TextRun({
        text: label.toUpperCase(),
        bold: true,
        color,
        size: 20, // 10pt in half-points
        characterSpacing: 40,
      }),
    ],
  });
}

/** Single bullet paragraph: "•  <text>" */
export function bulletParagraph(text: string, primaryColor = "#111827"): Paragraph {
  const color = hexToDocxColor(primaryColor);
  return new Paragraph({
    spacing: { after: 40 },
    indent: { left: convertInchesToTwip(0.2) },
    children: [
      new TextRun({ text: "• ", color, size: 18 }),
      new TextRun({ text, color: "374151", size: 18 }),
    ],
  });
}

/** Parse a multi-line bullet description into Paragraph[] */
export function bulletParagraphs(description: string, primaryColor = "#111827"): Paragraph[] {
  return parseBullets(description).map((line) => bulletParagraph(line, primaryColor));
}

/**
 * Title + company/subtitle row with date right-aligned via TabStop.
 * Returns 1-2 paragraphs: [title+date row, subtitle row (if subtitle provided)]
 */
export function itemHeaderParagraphs(
  title: string,
  subtitle: string | null | undefined,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  primaryColor: string
): Paragraph[] {
  const color = hexToDocxColor(primaryColor);
  const date = dateRange(startDate, endDate);
  const paragraphs: Paragraph[] = [];

  // Row 1: bold title (left) + date (right via tab)
  paragraphs.push(
    new Paragraph({
      spacing: { before: 120, after: 20 },
      tabStops: [{ type: TabStopType.RIGHT, position: PAGE_WIDTH_TWIP }],
      children: [
        new TextRun({ text: title, bold: true, size: 20 }),
        ...(date ? [new TextRun({ text: "\t" + date, color: "9CA3AF", size: 16 })] : []),
      ],
    })
  );

  // Row 2: subtitle/company in primary color
  if (subtitle) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: subtitle, color, size: 18 }),
        ],
      })
    );
  }

  return paragraphs;
}

/** Contact info row: icon-label + value, gray text */
export function contactLine(label: string, value: string, isUrl = false): Paragraph {
  if (isUrl) {
    return new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: label + " ", color: "9CA3AF", size: 16 }),
        new ExternalHyperlink({
          link: value.startsWith("http") ? value : `https://${value}`,
          children: [new TextRun({ text: value, color: "2563EB", size: 16, style: "Hyperlink" })],
        }),
      ],
    });
  }
  return new Paragraph({
    spacing: { after: 40 },
    children: [
      new TextRun({ text: label + "  ", color: "9CA3AF", size: 16 }),
      new TextRun({ text: value, color: "374151", size: 16 }),
    ],
  });
}

/** Skills row: "Label:  skill1  ·  skill2  ·  skill3" */
export function skillsRow(label: string, skills: string[], primaryColor: string): Paragraph {
  const color = hexToDocxColor(primaryColor);
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: label + ":  ", bold: true, color: "374151", size: 18 }),
      new TextRun({ text: skills.join("  ·  "), color: "6B7280", size: 18 }),
    ],
  });
}

/** Centered name heading */
export function nameHeading(fullName: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [
      new TextRun({ text: fullName, bold: true, size: 48, color: "111827" }),
    ],
  });
}

/** Centered contact line (for Classic header) */
export function centeredContactParagraph(items: string[]): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: items.flatMap((item, i) => [
      new TextRun({ text: item, color: "4B5563", size: 17 }),
      ...(i < items.length - 1 ? [new TextRun({ text: "  ·  ", color: "9CA3AF", size: 17 })] : []),
    ]),
  });
}

/** Horizontal rule (thin full-width line) */
export function hrParagraph(color = "E5E7EB"): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 2, color },
    },
    children: [],
  });
}
