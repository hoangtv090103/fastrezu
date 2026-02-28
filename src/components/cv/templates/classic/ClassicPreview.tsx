"use client";

import React from "react";
import {
  TailoredResumeData,
  ColorTheme,
  COLOR_THEMES,
  SECTION_LABELS,
} from "../shared/types";
import { dateRange, parseBullets } from "../shared/utils";

interface Props {
  data: TailoredResumeData;
  language?: "vi" | "en";
  colorTheme?: ColorTheme;
}

export default function ClassicPreview({
  data,
  language = "vi",
  colorTheme = "blue",
}: Props) {
  const c = COLOR_THEMES[colorTheme];
  const lbl = SECTION_LABELS[language];
  const { personal, summary, experience, education, skills, projects, certifications } = data;

  return (
    <div
      style={{
        fontFamily: '"Roboto", Roboto, sans-serif',
        background: "#fff",
        color: "#111827",
        padding: "36px 44px",
        width: "100%",
        maxWidth: "794px",
        margin: "0 auto",
        boxSizing: "border-box",
        lineHeight: 1.5,
      }}
    >
      {/* ── Header ── */}
      <div style={{ textAlign: "center", borderBottom: `2.5px solid ${c.primary}`, paddingBottom: "14px", marginBottom: "6px" }}>
        <h1 style={{ fontSize: "20pt", fontWeight: 700, color: "#111827", margin: "0 0 8px", letterSpacing: "0.5px" }}>
          {personal.full_name}
        </h1>
        <div style={{ fontSize: "9.5pt", color: "#6b7280", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>·  {personal.phone}</span>}
          {personal.address && <span>·  {personal.address}</span>}
        </div>
        {(personal.linkedin || personal.github || personal.website) && (
          <div style={{ fontSize: "9.5pt", color: c.primary, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "4px" }}>
            {personal.linkedin && <span>LinkedIn: {personal.linkedin}</span>}
            {personal.github && <span>·  GitHub: {personal.github}</span>}
            {personal.website && <span>·  {personal.website}</span>}
          </div>
        )}
      </div>

      {/* ── Summary ── */}
      {summary && (
        <Section title={lbl.summary} color={c.primary}>
          <p style={{ fontSize: "10pt", color: "#374151", lineHeight: 1.65, margin: 0, textAlign: "justify" }}>{summary}</p>
        </Section>
      )}

      {/* ── Experience ── */}
      {experience.length > 0 && (
        <Section title={lbl.experience} color={c.primary}>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: i < experience.length - 1 ? "12px" : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "10.5pt", fontWeight: 700, color: "#111827" }}>{exp.title}</span>
                  {exp.company && <span style={{ fontSize: "10pt", color: "#6b7280" }}> — {exp.company}</span>}
                </div>
                {dateRange(exp.start_date, exp.end_date) && (
                  <span style={{ fontSize: "9pt", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "8px", flexShrink: 0 }}>
                    {dateRange(exp.start_date, exp.end_date)}
                  </span>
                )}
              </div>
              {exp.description && <BulletList text={exp.description} accentColor={c.primary} />}
            </div>
          ))}
        </Section>
      )}

      {/* ── Education ── */}
      {education.length > 0 && (
        <Section title={lbl.education} color={c.primary}>
          {education.map((edu, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "7px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "10.5pt", fontWeight: 700, color: "#111827" }}>{edu.degree}</div>
                {edu.institution && (
                  <div style={{ fontSize: "9.5pt", color: "#6b7280" }}>
                    {edu.institution}{edu.gpa ? `  ·  ${lbl.gpa}: ${edu.gpa}` : ""}
                  </div>
                )}
              </div>
              {dateRange(edu.start_date, edu.end_date) && (
                <span style={{ fontSize: "9pt", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "8px", flexShrink: 0 }}>
                  {dateRange(edu.start_date, edu.end_date)}
                </span>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* ── Skills ── */}
      {(skills.technical.length > 0 || skills.soft.length > 0) && (
        <Section title={lbl.skills} color={c.primary}>
          {skills.technical.length > 0 && (
            <div style={{ marginBottom: "5px" }}>
              <span style={{ fontSize: "9.5pt", fontWeight: 700, color: "#374151" }}>{lbl.technicalSkills}: </span>
              <span style={{ fontSize: "9.5pt", color: "#6b7280" }}>{skills.technical.join("  ·  ")}</span>
            </div>
          )}
          {skills.soft.length > 0 && (
            <div>
              <span style={{ fontSize: "9.5pt", fontWeight: 700, color: "#374151" }}>{lbl.softSkills}: </span>
              <span style={{ fontSize: "9.5pt", color: "#6b7280" }}>{skills.soft.join("  ·  ")}</span>
            </div>
          )}
        </Section>
      )}

      {/* ── Projects ── */}
      {projects && projects.length > 0 && (
        <Section title={lbl.projects} color={c.primary}>
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "10.5pt", fontWeight: 700, color: "#111827" }}>{proj.name}</span>
                  {proj.role && <span style={{ fontSize: "9.5pt", color: "#6b7280" }}>  ·  {proj.role}</span>}
                  {proj.link && (
                    <a href={proj.link} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: "9pt", color: c.primary, marginLeft: "8px", textDecoration: "none" }}>
                      ↗ {lbl.viewProject}
                    </a>
                  )}
                </div>
                {dateRange(proj.start_date, proj.end_date) && (
                  <span style={{ fontSize: "9pt", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "8px", flexShrink: 0 }}>
                    {dateRange(proj.start_date, proj.end_date)}
                  </span>
                )}
              </div>
              {proj.technologies && proj.technologies.length > 0 && (
                <p style={{ fontSize: "9pt", color: "#6b7280", margin: "2px 0 4px" }}>{proj.technologies.join("  ·  ")}</p>
              )}
              {proj.description && <BulletList text={proj.description} accentColor={c.primary} />}
            </div>
          ))}
        </Section>
      )}

      {/* ── Certifications ── */}
      {certifications && certifications.length > 0 && (
        <Section title={lbl.certifications} color={c.primary}>
          {certifications.map((cert, i) => (
            <div key={i} style={{ marginBottom: "7px" }}>
              <div style={{ fontSize: "10pt", fontWeight: 700, color: "#111827" }}>{cert.name}</div>
              <div style={{ fontSize: "9.5pt", color: "#6b7280" }}>
                {cert.organization}{cert.issue_date ? `  ·  ${cert.issue_date}` : ""}
              </div>
              {cert.credential_url && (
                <a href={cert.credential_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "9pt", color: c.primary }}>↗ {lbl.viewProject}</a>
              )}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h2 style={{
        fontSize: "10.5pt", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em",
        borderBottom: `1.5px solid ${color}`, paddingBottom: "3px", marginBottom: "8px", marginTop: "14px",
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function BulletList({ text, accentColor }: { text: string; accentColor: string }) {
  const lines = parseBullets(text);
  return (
    <ul style={{ margin: "4px 0 0", padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "7px", marginBottom: "3px" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: accentColor, marginTop: "6px", flexShrink: 0 }} />
          <span style={{ fontSize: "9.5pt", color: "#374151", lineHeight: 1.55 }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}
