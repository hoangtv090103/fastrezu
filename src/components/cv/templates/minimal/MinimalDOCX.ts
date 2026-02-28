// ── Minimal DOCX Template ─────────────────────────────────────────────────────
// Ultra-clean: non-bold name, dash bullets, thin dividers, comma-separated skills.
// No photo (ATS-first).

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  TabStopType,
  convertInchesToTwip,
  ExternalHyperlink,
} from "docx";
import type { TailoredResumeData, ColorTheme } from "../shared/types";
import { COLOR_THEMES, SECTION_LABELS } from "../shared/types";
import { hexToDocxColor, spacer } from "../shared/docxUtils";
import { parseBullets, dateRange } from "../shared/utils";

void Packer;

const PAGE_WIDTH_TWIP = convertInchesToTwip(6.47);

function minimalHeading(label: string, primaryColor: string): Paragraph {
  const color = hexToDocxColor(primaryColor);
  return new Paragraph({
    spacing: { before: 140, after: 50 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "D1D5DB" } },
    children: [
      new TextRun({ text: label.toUpperCase(), bold: true, color, size: 17, characterSpacing: 60 }),
    ],
  });
}

function dashBullet(text: string, accentColor: string): Paragraph {
  return new Paragraph({
    spacing: { after: 40 },
    indent: { left: convertInchesToTwip(0.2) },
    children: [
      new TextRun({ text: "– ", color: hexToDocxColor(accentColor), size: 18 }),
      new TextRun({ text, color: "374151", size: 18 }),
    ],
  });
}

function itemRow(title: string, sub: string | null | undefined, start: string | null | undefined, end: string | null | undefined): Paragraph[] {
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
        spacing: { after: 30 },
        children: [new TextRun({ text: sub, color: "6B7280", size: 17 })],
      })
    );
  }
  return ps;
}

export function buildMinimalDOCX(
  data: TailoredResumeData,
  language: "vi" | "en" = "vi",
  colorTheme: ColorTheme = "blue"
): Document {
  const c = COLOR_THEMES[colorTheme];
  const lbl = SECTION_LABELS[language];
  const { personal, summary, experience, education, skills, projects, certifications } = data;
  const children: Paragraph[] = [];

  // ── Header ────────────────────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [new TextRun({ text: personal.full_name, bold: false, size: 44, color: "111827" })],
    })
  );

  // Contact + links on one centered line
  const allContact = [
    personal.email,
    personal.phone,
    personal.address,
    personal.linkedin,
    personal.github,
    personal.website,
  ].filter(Boolean) as string[];

  if (allContact.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: allContact.flatMap((item, i) => [
          new TextRun({ text: item, color: "4B5563", size: 16 }),
          ...(i < allContact.length - 1 ? [new TextRun({ text: "  ·  ", color: "9CA3AF", size: 16 })] : []),
        ]),
      })
    );
  }

  // Top HR
  children.push(
    new Paragraph({
      spacing: { before: 40, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "1F2937" } },
      children: [],
    })
  );

  // ── Summary ───────────────────────────────────────────────────────────────────
  if (summary) {
    children.push(minimalHeading(lbl.summary, c.primary));
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: summary, color: "374151", size: 18 })],
      })
    );
  }

  // ── Experience ────────────────────────────────────────────────────────────────
  if (experience.length > 0) {
    children.push(minimalHeading(lbl.experience, c.primary));
    for (const exp of experience) {
      children.push(...itemRow(exp.title, exp.company, exp.start_date, exp.end_date));
      if (exp.description) {
        for (const line of parseBullets(exp.description)) {
          children.push(dashBullet(line, c.primary));
        }
      }
      children.push(spacer(50));
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────────
  if (education.length > 0) {
    children.push(minimalHeading(lbl.education, c.primary));
    for (const edu of education) {
      const sub = [edu.institution, edu.gpa ? `${lbl.gpa}: ${edu.gpa}` : null].filter(Boolean).join("  ·  ");
      children.push(...itemRow(edu.degree, sub, edu.start_date, edu.end_date));
      children.push(spacer(40));
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────────────
  if (skills.technical.length > 0 || skills.soft.length > 0) {
    children.push(minimalHeading(lbl.skills, c.primary));
    if (skills.technical.length > 0) {
      children.push(
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({ text: lbl.technicalSkills + ":  ", bold: true, color: "374151", size: 18 }),
            new TextRun({ text: skills.technical.join(", "), color: "6B7280", size: 18 }),
          ],
        })
      );
    }
    if (skills.soft.length > 0) {
      children.push(
        new Paragraph({
          spacing: { after: 50 },
          children: [
            new TextRun({ text: lbl.softSkills + ":  ", bold: true, color: "374151", size: 18 }),
            new TextRun({ text: skills.soft.join(", "), color: "6B7280", size: 18 }),
          ],
        })
      );
    }
    children.push(spacer(40));
  }

  // ── Projects ──────────────────────────────────────────────────────────────────
  if (projects && projects.length > 0) {
    children.push(minimalHeading(lbl.projects, c.primary));
    for (const proj of projects) {
      children.push(...itemRow(proj.name, proj.role, proj.start_date, proj.end_date));
      if (proj.technologies && proj.technologies.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 30 },
            children: [new TextRun({ text: proj.technologies.join(", "), color: "6B7280", size: 16, italics: true })],
          })
        );
      }
      if (proj.link) {
        children.push(
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
      if (proj.description) {
        for (const line of parseBullets(proj.description)) {
          children.push(dashBullet(line, c.primary));
        }
      }
      children.push(spacer(50));
    }
  }

  // ── Certifications ────────────────────────────────────────────────────────────
  if (certifications && certifications.length > 0) {
    children.push(minimalHeading(lbl.certifications, c.primary));
    for (const cert of certifications) {
      const sub = [cert.organization, cert.issue_date].filter(Boolean).join("  ·  ");
      children.push(
        new Paragraph({ spacing: { before: 70, after: 20 }, children: [new TextRun({ text: cert.name, bold: true, size: 20 })] })
      );
      if (sub) children.push(new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: sub, color: "6B7280", size: 17 })] }));
      if (cert.credential_url) {
        children.push(
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
            margin: {
              top: convertInchesToTwip(0.9),
              bottom: convertInchesToTwip(0.9),
              left: convertInchesToTwip(0.9),
              right: convertInchesToTwip(0.9),
            },
            size: { orientation: PageOrientation.PORTRAIT },
          },
        },
        children,
      },
    ],
  });
}
