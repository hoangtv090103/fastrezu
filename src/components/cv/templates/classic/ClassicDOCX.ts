// ── Classic DOCX Template ─────────────────────────────────────────────────────
// Single-column, centered header, primary-color section headings with bottom border.
// No photo (ATS-first).

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  PageOrientation,
  convertInchesToTwip,
  ExternalHyperlink,
} from "docx";
import type { TailoredResumeData, ColorTheme } from "../shared/types";
import { COLOR_THEMES, SECTION_LABELS } from "../shared/types";
import {
  hexToDocxColor,
  spacer,
  sectionHeading,
  bulletParagraphs,
  itemHeaderParagraphs,
  centeredContactParagraph,
  nameHeading,
  skillsRow,
} from "../shared/docxUtils";

// Suppress unused import warning — Packer is used by the calling hook via dynamic import
void Packer;

export function buildClassicDOCX(
  data: TailoredResumeData,
  language: "vi" | "en" = "vi",
  colorTheme: ColorTheme = "blue"
): Document {
  const c = COLOR_THEMES[colorTheme];
  const lbl = SECTION_LABELS[language];
  const { personal, summary, experience, education, skills, projects, certifications } = data;

  const children: Paragraph[] = [];

  // ── Header ────────────────────────────────────────────────────────────────────
  children.push(nameHeading(personal.full_name));

  // Contact line
  const contactItems: string[] = [];
  if (personal.email) contactItems.push(personal.email);
  if (personal.phone) contactItems.push(personal.phone);
  if (personal.address) contactItems.push(personal.address);
  if (contactItems.length) children.push(centeredContactParagraph(contactItems));

  // Links line
  const linkItems: string[] = [];
  if (personal.linkedin) linkItems.push(personal.linkedin);
  if (personal.github) linkItems.push(personal.github);
  if (personal.website) linkItems.push(personal.website);
  if (linkItems.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: linkItems.flatMap((link, i) => [
          new ExternalHyperlink({
            link: link.startsWith("http") ? link : `https://${link}`,
            children: [
              new TextRun({
                text: link,
                color: hexToDocxColor(c.primary),
                size: 16,
                style: "Hyperlink",
              }),
            ],
          }),
          ...(i < linkItems.length - 1
            ? [new TextRun({ text: "  ·  ", color: "9CA3AF", size: 16 })]
            : []),
        ]),
      })
    );
  }

  children.push(spacer(80));

  // ── Summary ───────────────────────────────────────────────────────────────────
  if (summary) {
    children.push(sectionHeading(lbl.summary, c.primary));
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: summary, color: "374151", size: 18 })],
      })
    );
  }

  // ── Experience ────────────────────────────────────────────────────────────────
  if (experience.length > 0) {
    children.push(sectionHeading(lbl.experience, c.primary));
    for (const exp of experience) {
      children.push(...itemHeaderParagraphs(exp.title, exp.company, exp.start_date, exp.end_date, c.primary));
      if (exp.description) {
        children.push(...bulletParagraphs(exp.description, c.primary));
      }
      children.push(spacer(60));
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────────
  if (education.length > 0) {
    children.push(sectionHeading(lbl.education, c.primary));
    for (const edu of education) {
      const subtitle = [edu.institution, edu.gpa ? `${lbl.gpa}: ${edu.gpa}` : null]
        .filter(Boolean)
        .join("  ·  ");
      children.push(...itemHeaderParagraphs(edu.degree, subtitle, edu.start_date, edu.end_date, c.primary));
      children.push(spacer(40));
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────────────
  if (skills.technical.length > 0 || skills.soft.length > 0) {
    children.push(sectionHeading(lbl.skills, c.primary));
    if (skills.technical.length > 0) {
      children.push(skillsRow(lbl.technicalSkills, skills.technical, c.primary));
    }
    if (skills.soft.length > 0) {
      children.push(skillsRow(lbl.softSkills, skills.soft, c.primary));
    }
    children.push(spacer(40));
  }

  // ── Projects ──────────────────────────────────────────────────────────────────
  if (projects && projects.length > 0) {
    children.push(sectionHeading(lbl.projects, c.primary));
    for (const proj of projects) {
      const subtitle = proj.role ?? undefined;
      children.push(...itemHeaderParagraphs(proj.name, subtitle, proj.start_date, proj.end_date, c.primary));
      if (proj.technologies && proj.technologies.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 30 },
            children: [
              new TextRun({ text: proj.technologies.join("  ·  "), color: "6B7280", size: 16, italics: true }),
            ],
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
                children: [
                  new TextRun({ text: `↗ ${lbl.viewProject}`, color: hexToDocxColor(c.primary), size: 16, style: "Hyperlink" }),
                ],
              }),
            ],
          })
        );
      }
      if (proj.description) {
        children.push(...bulletParagraphs(proj.description, c.primary));
      }
      children.push(spacer(60));
    }
  }

  // ── Certifications ────────────────────────────────────────────────────────────
  if (certifications && certifications.length > 0) {
    children.push(sectionHeading(lbl.certifications, c.primary));
    for (const cert of certifications) {
      const subtitle = [cert.organization, cert.issue_date].filter(Boolean).join("  ·  ");
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          children: [new TextRun({ text: cert.name, bold: true, size: 20 })],
        })
      );
      if (subtitle) {
        children.push(
          new Paragraph({
            spacing: { after: 30 },
            children: [new TextRun({ text: subtitle, color: "6B7280", size: 17 })],
          })
        );
      }
      if (cert.credential_url) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new ExternalHyperlink({
                link: cert.credential_url,
                children: [
                  new TextRun({ text: `↗ ${lbl.viewProject}`, color: hexToDocxColor(c.primary), size: 16, style: "Hyperlink" }),
                ],
              }),
            ],
          })
        );
      }
    }
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20 },
        },
      },
    },
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
