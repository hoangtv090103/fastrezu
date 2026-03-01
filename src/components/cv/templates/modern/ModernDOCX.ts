// ── Modern DOCX Template ──────────────────────────────────────────────────────
// Two-column layout: colored sidebar (30%) + white main (70%) using Table.
// Sidebar: photo + name + contact + skills. Main: summary + experience + projects + education + certifications.

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
import { hexToDocxColor, spacer, sectionHeading, bulletParagraphs } from "../shared/docxUtils";
import { dateRange } from "../shared/utils";

void Packer;

const PAGE_WIDTH_TWIP = convertInchesToTwip(6.47);
const PHOTO_SIZE = 72; // pt

/** Sidebar section heading (white text, lighter border) */
function sideHeading(label: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF40" } },
    children: [
      new TextRun({ text: label.toUpperCase(), bold: true, color: "FFFFFFBB", size: 17, characterSpacing: 40 }),
    ],
  });
}

/** White text paragraph for sidebar */
function sideText(text: string, bold = false, size = 17): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text, color: "FFFFFF", bold, size })],
  });
}

function sideContact(label: string, value: string): Paragraph[] {
  return [
    new Paragraph({ spacing: { after: 10 }, children: [new TextRun({ text: label.toUpperCase(), color: "FFFFFF99", size: 14, characterSpacing: 30 })] }),
    new Paragraph({ spacing: { after: 50 }, children: [new TextRun({ text: value, color: "FFFFFF", size: 16 })] }),
  ];
}

function mainItemRow(title: string, sub: string | null | undefined, start: string | null | undefined, end: string | null | undefined, primaryColor: string): Paragraph[] {
  const color = hexToDocxColor(primaryColor);
  const date = dateRange(start, end);
  const ps: Paragraph[] = [
    new Paragraph({
      spacing: { before: 100, after: 20 },
      tabStops: [{ type: TabStopType.RIGHT, position: PAGE_WIDTH_TWIP * 0.7 }],
      children: [
        new TextRun({ text: title, bold: true, size: 20 }),
        ...(date ? [new TextRun({ text: "\t" + date, color: "9CA3AF", size: 15 })] : []),
      ],
    }),
  ];
  if (sub) {
    ps.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: sub, color, size: 18 })] }));
  }
  return ps;
}

export function buildModernDOCX(
  data: TailoredResumeData,
  language: "vi" | "en" = "vi",
  colorTheme: ColorTheme = "blue",
  photoBuffer?: ArrayBuffer
): Document {
  const c = COLOR_THEMES[colorTheme];
  const lbl = SECTION_LABELS[language];
  const { personal, summary, experience, education, skills, projects, certifications } = data;

  const primaryColor = hexToDocxColor(c.primary);
  const shading = { type: ShadingType.SOLID, fill: primaryColor, color: primaryColor };
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "auto" };
  const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

  // ── Sidebar content ───────────────────────────────────────────────────────────
  const sidebarChildren: Paragraph[] = [];

  // Photo
  if (photoBuffer) {
    sidebarChildren.push(
      new Paragraph({
        spacing: { before: 120, after: 80 },
        children: [
          new ImageRun({
            data: photoBuffer,
            transformation: { width: PHOTO_SIZE * 4, height: PHOTO_SIZE * 4 },
            type: "png",
          }),
        ],
      })
    );
  } else {
    sidebarChildren.push(spacer(100));
  }

  // Name
  sidebarChildren.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [new TextRun({ text: personal.full_name, bold: true, size: 28, color: "FFFFFF" })],
    })
  );

  // Contact section
  sidebarChildren.push(sideHeading("Contact"));
  if (personal.email) sidebarChildren.push(...sideContact("Email", personal.email));
  if (personal.phone) sidebarChildren.push(...sideContact("Phone", personal.phone));
  if (personal.address) sidebarChildren.push(...sideContact("Address", personal.address));
  if (personal.linkedin) sidebarChildren.push(...sideContact("LinkedIn", personal.linkedin));
  if (personal.github) sidebarChildren.push(...sideContact("GitHub", personal.github));

  // Skills section in sidebar
  if (skills.technical.length > 0 || skills.soft.length > 0) {
    sidebarChildren.push(sideHeading(lbl.skills));
    if (skills.technical.length > 0) {
      sidebarChildren.push(
        new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: lbl.technicalSkills.toUpperCase(), color: "FFFFFF99", size: 14, characterSpacing: 30 })] })
      );
      for (const sk of skills.technical) {
        sidebarChildren.push(
          new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: "• " + sk, color: "FFFFFF", size: 16 })] })
        );
      }
    }
    if (skills.soft.length > 0) {
      sidebarChildren.push(
        new Paragraph({ spacing: { before: 80, after: 30 }, children: [new TextRun({ text: lbl.softSkills.toUpperCase(), color: "FFFFFF99", size: 14, characterSpacing: 30 })] })
      );
      for (const sk of skills.soft) {
        sidebarChildren.push(
          new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: "• " + sk, color: "FFFFFF", size: 16 })] })
        );
      }
    }
  }

  // Education in sidebar
  if (education.length > 0) {
    sidebarChildren.push(sideHeading(lbl.education));
    for (const edu of education) {
      sidebarChildren.push(sideText(edu.degree, true, 18));
      if (edu.institution) sidebarChildren.push(sideText(edu.institution, false, 16));
      if (edu.start_date || edu.end_date) {
        sidebarChildren.push(sideText(dateRange(edu.start_date, edu.end_date), false, 15));
      }
      sidebarChildren.push(spacer(40));
    }
  }

  // ── Main content ──────────────────────────────────────────────────────────────
  const mainChildren: Paragraph[] = [spacer(100)];

  if (summary) {
    mainChildren.push(sectionHeading(lbl.summary, c.primary));
    mainChildren.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: summary, color: "374151", size: 18 })] }));
  }

  if (experience.length > 0) {
    mainChildren.push(sectionHeading(lbl.experience, c.primary));
    for (const exp of experience) {
      mainChildren.push(...mainItemRow(exp.title, exp.company, exp.start_date, exp.end_date, c.primary));
      if (exp.description) mainChildren.push(...bulletParagraphs(exp.description, c.primary));
      mainChildren.push(spacer(50));
    }
  }

  if (projects && projects.length > 0) {
    mainChildren.push(sectionHeading(lbl.projects, c.primary));
    for (const proj of projects) {
      mainChildren.push(...mainItemRow(proj.name, proj.role, proj.start_date, proj.end_date, c.primary));
      if (proj.technologies?.length) {
        mainChildren.push(new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: proj.technologies.join("  ·  "), color: "6B7280", size: 16, italics: true })] }));
      }
      if (proj.link) {
        mainChildren.push(
          new Paragraph({
            spacing: { after: 30 },
            children: [
              new ExternalHyperlink({
                link: proj.link.startsWith("http") ? proj.link : `https://${proj.link}`,
                children: [new TextRun({ text: `↗ ${lbl.viewProject}`, color: primaryColor, size: 16, style: "Hyperlink" })],
              }),
            ],
          })
        );
      }
      if (proj.description) mainChildren.push(...bulletParagraphs(proj.description, c.primary));
      mainChildren.push(spacer(50));
    }
  }

  if (certifications && certifications.length > 0) {
    mainChildren.push(sectionHeading(lbl.certifications, c.primary));
    for (const cert of certifications) {
      const sub = [cert.organization, cert.issue_date].filter(Boolean).join("  ·  ");
      mainChildren.push(new Paragraph({ spacing: { before: 70, after: 20 }, children: [new TextRun({ text: cert.name, bold: true, size: 20 })] }));
      if (sub) mainChildren.push(new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: sub, color: "6B7280", size: 17 })] }));
      if (cert.credential_url) {
        mainChildren.push(
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

  // ── Two-column Table ──────────────────────────────────────────────────────────
  const layoutTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
    rows: [
      new TableRow({
        children: [
          // Sidebar (30%)
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading,
            borders: cellBorders,
            verticalAlign: VerticalAlign.TOP,
            children: sidebarChildren,
          }),
          // Main (70%)
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            verticalAlign: VerticalAlign.TOP,
            children: mainChildren,
            margins: { left: convertInchesToTwip(0.25), right: convertInchesToTwip(0.1) },
          }),
        ],
      }),
    ],
  });

  return new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0),
              bottom: convertInchesToTwip(0),
              left: convertInchesToTwip(0),
              right: convertInchesToTwip(0),
            },
            size: { orientation: PageOrientation.PORTRAIT },
          },
        },
        children: [layoutTable],
      },
    ],
  });
}
