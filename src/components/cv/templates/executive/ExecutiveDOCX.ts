// ── Executive DOCX Template ───────────────────────────────────────────────────
// Full-width colored header band (Table shading), optional photo, left-border section headings.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  BorderStyle,
  VerticalAlign,
  PageOrientation,
  TabStopType,
  convertInchesToTwip,
  ImageRun,
  ExternalHyperlink,
} from "docx";
import type { TailoredResumeData, ColorTheme } from "../shared/types";
import { COLOR_THEMES, SECTION_LABELS } from "../shared/types";
import {
  hexToDocxColor,
  spacer,
  bulletParagraphs,
  skillsRow,
} from "../shared/docxUtils";
import { parseBullets, dateRange } from "../shared/utils";

void Packer;

const PAGE_WIDTH_TWIP = convertInchesToTwip(6.47);
const PHOTO_SIZE = 64; // pt — used for ImageRun width/height

function execSectionHeading(label: string, primaryColor: string): Paragraph {
  const color = hexToDocxColor(primaryColor);
  return new Paragraph({
    spacing: { before: 160, after: 70 },
    border: {
      left: { style: BorderStyle.THICK, size: 16, color },
    },
    indent: { left: convertInchesToTwip(0.18) },
    children: [
      new TextRun({ text: label.toUpperCase(), bold: true, color: "111827", size: 19, characterSpacing: 40 }),
    ],
  });
}

function itemRow(title: string, sub: string | null | undefined, start: string | null | undefined, end: string | null | undefined, primaryColor: string): Paragraph[] {
  const color = hexToDocxColor(primaryColor);
  const date = dateRange(start, end);
  const ps: Paragraph[] = [
    new Paragraph({
      spacing: { before: 100, after: 20 },
      tabStops: [{ type: TabStopType.RIGHT, position: PAGE_WIDTH_TWIP }],
      children: [
        new TextRun({ text: title, bold: true, size: 20 }),
        ...(date ? [new TextRun({ text: "\t" + date, color: "9CA3AF", size: 16 })] : []),
      ],
    }),
  ];
  if (sub) {
    ps.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: sub, color, size: 18 })],
      })
    );
  }
  return ps;
}

/** Build the colored header band as a full-width Table */
function buildHeader(personal: TailoredResumeData["personal"], c: { primary: string }, lbl: typeof SECTION_LABELS["vi"], photoBuffer?: ArrayBuffer): Table {
  const color = hexToDocxColor(c.primary);
  const shading = { type: ShadingType.SOLID, fill: color, color };

  // Contact items
  const contactParts: string[] = [
    personal.email ?? "",
    personal.phone ?? "",
    personal.address ?? "",
    personal.linkedin ?? "",
    personal.github ?? "",
  ].filter(Boolean);

  const contactText = contactParts.join("  ·  ");

  const textCellChildren: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: personal.full_name, bold: true, size: 40, color: "FFFFFF" })],
    }),
    new Paragraph({
      spacing: { after: 0 },
      children: [new TextRun({ text: contactText, color: "FFFFFF", size: 16 })],
    }),
  ];

  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  if (photoBuffer) {
    // Two-cell header: photo left, name/contact right
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, },
      rows: [
        new TableRow({
          children: [
            // Photo cell
            new TableCell({
              width: { size: 18, type: WidthType.PERCENTAGE },
              shading,
              borders: cellBorders,
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  spacing: { after: 0 },
                  children: [
                    new ImageRun({
                      data: photoBuffer,
                      transformation: { width: PHOTO_SIZE * 4, height: PHOTO_SIZE * 4 },
                      type: "png",
                    }),
                  ],
                }),
              ],
            }),
            // Name/contact cell
            new TableCell({
              width: { size: 82, type: WidthType.PERCENTAGE },
              shading,
              borders: cellBorders,
              verticalAlign: VerticalAlign.CENTER,
              children: textCellChildren,
            }),
          ],
        }),
      ],
    });
  }

  // Single-cell header
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading,
            borders: cellBorders,
            children: [
              new Paragraph({
                spacing: { before: 160, after: 60 },
                children: [new TextRun({ text: "  " })],
              }),
              ...textCellChildren,
              new Paragraph({
                spacing: { before: 60, after: 0 },
                children: [new TextRun({ text: "  " })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

export function buildExecutiveDOCX(
  data: TailoredResumeData,
  language: "vi" | "en" = "vi",
  colorTheme: ColorTheme = "blue",
  photoBuffer?: ArrayBuffer
): Document {
  const c = COLOR_THEMES[colorTheme];
  const lbl = SECTION_LABELS[language];
  const { personal, summary, experience, education, skills, projects, certifications } = data;

  // Header band paragraphs (simpler approach than Table for consistent shading)
  const color = hexToDocxColor(c.primary);
  const shading = { type: ShadingType.SOLID, fill: color, color };
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  // Contact string
  const contactParts = [personal.email, personal.phone, personal.address, personal.linkedin, personal.github]
    .filter(Boolean).join("  ·  ");

  // Header as Table (full-width shaded)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, },
    rows: [
      new TableRow({
        children: [
          ...(photoBuffer
            ? [
                new TableCell({
                  width: { size: 16, type: WidthType.PERCENTAGE },
                  shading,
                  borders: cellBorders,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      children: [
                        new ImageRun({
                          data: photoBuffer,
                          transformation: { width: PHOTO_SIZE * 4, height: PHOTO_SIZE * 4 },
                          type: "png",
                        }),
                      ],
                    }),
                  ],
                }),
              ]
            : []),
          new TableCell({
            width: { size: photoBuffer ? 84 : 100, type: WidthType.PERCENTAGE },
            shading,
            borders: cellBorders,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                spacing: { before: 160, after: 50 },
                children: [new TextRun({ text: personal.full_name, bold: true, size: 40, color: "FFFFFF" })],
              }),
              new Paragraph({
                spacing: { after: 160 },
                children: [new TextRun({ text: contactParts, color: "FFFFFF", size: 16 })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const bodyChildren: Paragraph[] = [];

  // ── Summary ───────────────────────────────────────────────────────────────────
  if (summary) {
    bodyChildren.push(execSectionHeading(lbl.summary, c.primary));
    bodyChildren.push(
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: summary, color: "374151", size: 18 })] })
    );
  }

  // ── Experience ────────────────────────────────────────────────────────────────
  if (experience.length > 0) {
    bodyChildren.push(execSectionHeading(lbl.experience, c.primary));
    for (const exp of experience) {
      bodyChildren.push(...itemRow(exp.title, exp.company, exp.start_date, exp.end_date, c.primary));
      if (exp.description) bodyChildren.push(...bulletParagraphs(exp.description, c.primary));
      bodyChildren.push(spacer(50));
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────────
  if (education.length > 0) {
    bodyChildren.push(execSectionHeading(lbl.education, c.primary));
    for (const edu of education) {
      const sub = [edu.institution, edu.gpa ? `${lbl.gpa}: ${edu.gpa}` : null].filter(Boolean).join("  ·  ");
      bodyChildren.push(...itemRow(edu.degree, sub, edu.start_date, edu.end_date, c.primary));
      bodyChildren.push(spacer(40));
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────────────
  if (skills.technical.length > 0 || skills.soft.length > 0) {
    bodyChildren.push(execSectionHeading(lbl.skills, c.primary));
    if (skills.technical.length > 0) bodyChildren.push(skillsRow(lbl.technicalSkills, skills.technical, c.primary));
    if (skills.soft.length > 0) bodyChildren.push(skillsRow(lbl.softSkills, skills.soft, c.primary));
    bodyChildren.push(spacer(40));
  }

  // ── Projects ──────────────────────────────────────────────────────────────────
  if (projects && projects.length > 0) {
    bodyChildren.push(execSectionHeading(lbl.projects, c.primary));
    for (const proj of projects) {
      bodyChildren.push(...itemRow(proj.name, proj.role, proj.start_date, proj.end_date, c.primary));
      if (proj.technologies?.length) {
        bodyChildren.push(
          new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: proj.technologies.join("  ·  "), color: "6B7280", size: 16, italics: true })] })
        );
      }
      if (proj.link) {
        bodyChildren.push(
          new Paragraph({
            spacing: { after: 30 },
            children: [
              new ExternalHyperlink({
                link: proj.link.startsWith("http") ? proj.link : `https://${proj.link}`,
                children: [new TextRun({ text: `↗ ${lbl.viewProject}`, color: hexToDocxColor(c.primary), size: 16, style: "Hyperlink" })],
              }),
            ],
          })
        );
      }
      if (proj.description) bodyChildren.push(...bulletParagraphs(proj.description, c.primary));
      bodyChildren.push(spacer(50));
    }
  }

  // ── Certifications ────────────────────────────────────────────────────────────
  if (certifications && certifications.length > 0) {
    bodyChildren.push(execSectionHeading(lbl.certifications, c.primary));
    for (const cert of certifications) {
      const sub = [cert.organization, cert.issue_date].filter(Boolean).join("  ·  ");
      bodyChildren.push(new Paragraph({ spacing: { before: 70, after: 20 }, children: [new TextRun({ text: cert.name, bold: true, size: 20 })] }));
      if (sub) bodyChildren.push(new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: sub, color: "6B7280", size: 17 })] }));
      if (cert.credential_url) {
        bodyChildren.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new ExternalHyperlink({
                link: cert.credential_url,
                children: [new TextRun({ text: `↗ ${lbl.viewProject}`, color: hexToDocxColor(c.primary), size: 16, style: "Hyperlink" })],
              }),
            ],
          })
        );
      }
    }
  }

  return new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 0, bottom: convertInchesToTwip(0.9), left: 0, right: 0 },
            size: { orientation: PageOrientation.PORTRAIT },
          },
        },
        children: [
          headerTable,
          new Paragraph({
            spacing: { after: 0 },
            children: [],
          }),
          ...bodyChildren.map((p) => {
            // Add side margins to body paragraphs via indent
            return p;
          }),
        ],
      },
    ],
  });
}
