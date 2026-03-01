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

export default function ExecutivePreview({
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
        width: "100%",
        maxWidth: "794px",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* ── Full-width color header band ── */}
      <div style={{ background: c.primary, padding: "28px 44px 24px", display: "flex", alignItems: "center", gap: "20px" }}>
        {personal.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={personal.photo_url}
            alt={personal.full_name}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid rgba(255,255,255,0.5)",
              flexShrink: 0,
            }}
          />
        )}
        <div>
          <h1 style={{ fontSize: "20pt", fontWeight: 700, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.3px" }}>
            {personal.full_name}
          </h1>
          <div style={{ fontSize: "9pt", color: "rgba(255,255,255,0.85)", display: "flex", flexWrap: "wrap", gap: "14px" }}>
            {personal.email && <span>{personal.email}</span>}
            {personal.phone && <span>·  {personal.phone}</span>}
            {personal.address && <span>·  {personal.address}</span>}
            {personal.linkedin && <span>·  {personal.linkedin}</span>}
            {personal.github && <span>·  {personal.github}</span>}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "28px 44px" }}>
        {/* Summary */}
        {summary && (
          <ExecSection title={lbl.summary} color={c.primary}>
            <p style={{ fontSize: "10pt", color: "#374151", lineHeight: 1.7, margin: 0 }}>{summary}</p>
          </ExecSection>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <ExecSection title={lbl.experience} color={c.primary}>
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "11pt", fontWeight: 700, color: "#111827" }}>{exp.title}</span>
                    {exp.company && (
                      <span style={{ fontSize: "10pt", color: "#6b7280" }}>{" "}— {exp.company}</span>
                    )}
                  </div>
                  {dateRange(exp.start_date, exp.end_date) && (
                    <span style={{ fontSize: "9pt", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "8px", flexShrink: 0, fontStyle: "italic" }}>
                      {dateRange(exp.start_date, exp.end_date)}
                    </span>
                  )}
                </div>
                {exp.description && <BulletList text={exp.description} accentColor={c.primary} />}
              </div>
            ))}
          </ExecSection>
        )}

        {/* Education */}
        {education.length > 0 && (
          <ExecSection title={lbl.education} color={c.primary}>
            {education.map((edu, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: "10.5pt", fontWeight: 700, color: "#111827" }}>{edu.degree}</div>
                  {edu.institution && (
                    <div style={{ fontSize: "9.5pt", color: "#6b7280" }}>
                      {edu.institution}{edu.gpa ? `  ·  ${lbl.gpa}: ${edu.gpa}` : ""}
                    </div>
                  )}
                </div>
                {dateRange(edu.start_date, edu.end_date) && (
                  <span style={{ fontSize: "9pt", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "8px", flexShrink: 0, fontStyle: "italic" }}>
                    {dateRange(edu.start_date, edu.end_date)}
                  </span>
                )}
              </div>
            ))}
          </ExecSection>
        )}

        {/* Skills — inline pills */}
        {(skills.technical.length > 0 || skills.soft.length > 0) && (
          <ExecSection title={lbl.skills} color={c.primary}>
            {skills.technical.length > 0 && (
              <div style={{ marginBottom: "8px" }}>
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
          </ExecSection>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <ExecSection title={lbl.projects} color={c.primary}>
            {projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: "12px" }}>
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
                    <span style={{ fontSize: "9pt", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "8px", flexShrink: 0, fontStyle: "italic" }}>
                      {dateRange(proj.start_date, proj.end_date)}
                    </span>
                  )}
                </div>
                {proj.technologies && proj.technologies.length > 0 && (
                  <p style={{ fontSize: "9pt", color: "#6b7280", margin: "2px 0 3px" }}>{proj.technologies.join("  ·  ")}</p>
                )}
                {proj.description && <BulletList text={proj.description} accentColor={c.primary} />}
              </div>
            ))}
          </ExecSection>
        )}

        {/* Certifications */}
        {certifications && certifications.length > 0 && (
          <ExecSection title={lbl.certifications} color={c.primary}>
            {certifications.map((cert, i) => (
              <div key={i} style={{ marginBottom: "7px" }}>
                <div style={{ fontSize: "10.5pt", fontWeight: 700, color: "#111827" }}>{cert.name}</div>
                <div style={{ fontSize: "9.5pt", color: "#6b7280" }}>
                  {cert.organization}{cert.issue_date ? `  ·  ${cert.issue_date}` : ""}
                </div>
                {cert.credential_url && (
                  <a href={cert.credential_url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: "9pt", color: c.primary }}>↗ {lbl.viewProject}</a>
                )}
              </div>
            ))}
          </ExecSection>
        )}
      </div>
    </div>
  );
}

function ExecSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div style={{ width: "4px", height: "18px", background: color, borderRadius: "2px", flexShrink: 0 }} />
        <h2 style={{ fontSize: "11pt", fontWeight: 700, color: "#111827", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
      </div>
      {children}
    </div>
  );
}

function BulletList({ text, accentColor }: { text: string; accentColor: string }) {
  const lines = parseBullets(text);
  return (
    <ul style={{ margin: "5px 0 0", padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: accentColor, marginTop: "6px", flexShrink: 0 }} />
          <span style={{ fontSize: "9.5pt", color: "#374151", lineHeight: 1.6 }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}
