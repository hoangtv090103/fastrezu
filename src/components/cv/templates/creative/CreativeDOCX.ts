// ── Creative DOCX Template ────────────────────────────────────────────────────
// Colored header band + dark accent bar, left-border item blocks, bold-color dates.

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
import { hexToDocxColor, spacer, sectionHeading } from "../shared/docxUtils";
import { parseBullets, dateRange } from "../shared/utils";

void Packer;

const PAGE_WIDTH_TWIP = convertInchesToTwip(6.47);
const PHOTO_SIZE = 64;

function creativeItemBlock(
  title: string,
  sub: string | null | undefined,
  start: string | null | undefined,
  end: string | null | undefined,
  description: string | null | undefined,
  technologies: string[] | undefined,
  link: string | null | undefined,
  primaryColor: string,
  lightColor: string,
  viewProjectLabel: string
): Paragraph[] {
  const color = hexToDocxColor(primaryColor);
  const lightBorderColor = hexToDocxColor(lightColor);
  const date = dateRange(start, end);
  const ps: Paragraph[] = [];

  // Title + date (right-tab)
  ps.push(
    new Paragraph({
      spacing: { before: 100, after: 20 },
      tabStops: [{ type: TabStopType.RIGHT, position: PAGE_WIDTH_TWIP }],
      border: { left: { style: BorderStyle.THICK, size: 20, color: lightBorderColor } },
      indent: { left: convertInchesToTwip(0.18) },
      children: [
        new TextRun({ text: title, bold: true, size: 20 }),
        ...(date ? [new TextRun({ text: "\t", size: 20 }), new TextRun({ text: date, bold: true, color, size: 16 })] : []),
      ],
    })
  );

  // Subtitle/company
  if (sub) {
    ps.push(
      new Paragraph({
        spacing: { after: 30 },
        border: { left: { style: BorderStyle.THICK, size: 20, color: lightBorderColor } },
        indent: { left: convertInchesToTwip(0.18) },
        children: [new TextRun({ text: sub, color, size: 18 })],
      })
    );
  }

  // Technologies
  if (technologies && technologies.length > 0) {
    ps.push(
      new Paragraph({
        spacing: { after: 30 },
        border: { left: { style: BorderStyle.THICK, size: 20, color: lightBorderColor } },
        indent: { left: convertInchesToTwip(0.18) },
        children: [new TextRun({ text: technologies.join("  ·  "), color: "6B7280", size: 16, italics: true })],
      })
    );
  }

  // Link
  if (link) {
    ps.push(
      new Paragraph({
        spacing: { after: 30 },
        border: { left: { style: BorderStyle.THICK, size: 20, color: lightBorderColor } },
        indent: { left: convertInchesToTwip(0.18) },
        children: [
          new ExternalHyperlink({
            link: link.startsWith("http") ? link : `https://${link}`,
            children: [new TextRun({ text: `↗ ${viewProjectLabel}`, color: hexToDocxColor(primaryColor), size: 16, style: "Hyperlink" })],
          }),
        ],
      })
    );
  }

  // Bullets
  if (description) {
    for (const line of parseBullets(description)) {
      ps.push(
        new Paragraph({
          spacing: { after: 40 },
          border: { left: { style: BorderStyle.THICK, size: 20, color: lightBorderColor } },
          indent: { left: convertInchesToTwip(0.38) },
          children: [
            new TextRun({ text: "• ", color, size: 18 }),
            new TextRun({ text: line, color: "374151", size: 18 }),
          ],
        })
      );
    }
  }

  ps.push(spacer(60));
  return ps;
}

export function buildCreativeDOCX(
  data: TailoredResumeData,
  language: "vi" | "en" = "vi",
  colorTheme: ColorTheme = "blue",
  photoBuffer?: ArrayBuffer
): Document {
  const c = COLOR_THEMES[colorTheme];
  const lbl = SECTION_LABELS[language];
  const { personal, summary, experience, education, skills, projects, certifications } = data;

  const primaryColor = hexToDocxColor(c.primary);
  const darkColor = hexToDocxColor(c.dark);
  const shading = { type: ShadingType.SOLID, fill: primaryColor, color: primaryColor };
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  const contactParts = [personal.email, personal.phone, personal.address, personal.linkedin, personal.github]
    .filter(Boolean).join("  ·  ");

  // Header band
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
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
                children: [new TextRun({ text: personal.full_name, bold: true, size: 44, color: "FFFFFF" })],
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

  // Dark accent bar below header
  const accentBar = new Paragraph({
    spacing: { before: 0, after: 0 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: darkColor } },
    children: [],
  });

  const bodyChildren: Paragraph[] = [spacer(60)];

  // ── Summary ───────────────────────────────────────────────────────────────────
  if (summary) {
    bodyChildren.push(sectionHeading(lbl.summary, c.primary));
    bodyChildren.push(
      new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: summary, color: "374151", size: 18 })] })
    );
  }

  // ── Experience ────────────────────────────────────────────────────────────────
  if (experience.length > 0) {
    bodyChildren.push(sectionHeading(lbl.experience, c.primary));
    for (const exp of experience) {
      bodyChildren.push(
        ...creativeItemBlock(exp.title, exp.company, exp.start_date, exp.end_date, exp.description, undefined, undefined, c.primary, c.light, lbl.viewProject)
      );
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────────
  if (education.length > 0) {
    bodyChildren.push(sectionHeading(lbl.education, c.primary));
    for (const edu of education) {
      const sub = [edu.institution, edu.gpa ? `${lbl.gpa}: ${edu.gpa}` : null].filter(Boolean).join("  ·  ");
      bodyChildren.push(
        ...creativeItemBlock(edu.degree, sub, edu.start_date, edu.end_date, null, undefined, undefined, c.primary, c.light, lbl.viewProject)
      );
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────────────
  if (skills.technical.length > 0 || skills.soft.length > 0) {
    bodyChildren.push(sectionHeading(lbl.skills, c.primary));
    if (skills.technical.length > 0) {
      bodyChildren.push(
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({ text: lbl.technicalSkills + ":  ", bold: true, color: "374151", size: 18 }),
            ...skills.technical.flatMap((sk, i) => [
              new TextRun({ text: sk, color: primaryColor, size: 17 }),
              ...(i < skills.technical.length - 1 ? [new TextRun({ text: "  ·  ", color: "9CA3AF", size: 17 })] : []),
            ]),
          ],
        })
      );
    }
    if (skills.soft.length > 0) {
      bodyChildren.push(
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({ text: lbl.softSkills + ":  ", bold: true, color: "374151", size: 18 }),
            new TextRun({ text: skills.soft.join("  ·  "), color: "6B7280", size: 17 }),
          ],
        })
      );
    }
    bodyChildren.push(spacer(40));
  }

  // ── Projects ──────────────────────────────────────────────────────────────────
  if (projects && projects.length > 0) {
    bodyChildren.push(sectionHeading(lbl.projects, c.primary));
    for (const proj of projects) {
      bodyChildren.push(
        ...creativeItemBlock(proj.name, proj.role, proj.start_date, proj.end_date, proj.description, proj.technologies, proj.link, c.primary, c.light, lbl.viewProject)
      );
    }
  }

  // ── Certifications ────────────────────────────────────────────────────────────
  if (certifications && certifications.length > 0) {
    bodyChildren.push(sectionHeading(lbl.certifications, c.primary));
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
                children: [new TextRun({ text: `↗ ${lbl.viewProject}`, color: primaryColor, size: 16, style: "Hyperlink" })],
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
            margin: {
              top: 0,
              bottom: convertInchesToTwip(0.9),
              left: convertInchesToTwip(0.9),
              right: convertInchesToTwip(0.9),
            },
            size: { orientation: PageOrientation.PORTRAIT },
          },
        },
        children: [
          headerTable,
          accentBar,
          ...bodyChildren,
        ],
      },
    ],
  });
}
