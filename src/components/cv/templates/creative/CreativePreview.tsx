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

export default function CreativePreview({
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
      {/* ── Gradient Hero Header ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${c.primary} 0%, ${c.dark} 100%)`,
          padding: "36px 44px 28px",
          display: "flex",
          alignItems: "center",
          gap: "24px",
        }}
      >
        {personal.photo_url && (
          <img
            src={personal.photo_url}
            alt={personal.full_name}
            style={{
              width: "88px",
              height: "88px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid rgba(255,255,255,0.55)",
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: "20pt",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 6px",
              lineHeight: 1.2,
            }}
          >
            {personal.full_name}
          </h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              fontSize: "8.5pt",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {personal.email && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>✉</span> {personal.email}
              </span>
            )}
            {personal.phone && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>📱</span> {personal.phone}
              </span>
            )}
            {personal.address && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>📍</span> {personal.address}
              </span>
            )}
            {personal.linkedin && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>in</span> {personal.linkedin}
              </span>
            )}
            {personal.github && (
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span>⌥</span> {personal.github}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Accent bar ── */}
      <div style={{ height: "4px", background: `linear-gradient(90deg, ${c.primary}, ${c.light})` }} />

      {/* ── Body ── */}
      <div style={{ padding: "28px 44px" }}>
        {summary && (
          <CreativeSection title={lbl.summary} color={c.primary} light={c.light}>
            <p style={{ fontSize: "10pt", color: "#374151", lineHeight: 1.7, margin: 0 }}>{summary}</p>
          </CreativeSection>
        )}

        {experience.length > 0 && (
          <CreativeSection title={lbl.experience} color={c.primary} light={c.light}>
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "14px", paddingLeft: "12px", borderLeft: `3px solid ${c.light}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "11pt", fontWeight: 700, color: "#111827" }}>{exp.title}</span>
                    {exp.company && (
                      <span style={{ fontSize: "10pt", color: c.primary, fontWeight: 600 }}>{" "}• {exp.company}</span>
                    )}
                  </div>
                  {dateRange(exp.start_date, exp.end_date) && (
                    <span
                      style={{
                        fontSize: "8.5pt",
                        color: "#fff",
                        background: c.primary,
                        padding: "2px 8px",
                        borderRadius: "20px",
                        whiteSpace: "nowrap",
                        marginLeft: "8px",
                        flexShrink: 0,
                      }}
                    >
                      {dateRange(exp.start_date, exp.end_date)}
                    </span>
                  )}
                </div>
                {exp.description && <BulletList text={exp.description} accentColor={c.primary} />}
              </div>
            ))}
          </CreativeSection>
        )}

        {education.length > 0 && (
          <CreativeSection title={lbl.education} color={c.primary} light={c.light}>
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
                  <span
                    style={{
                      fontSize: "8.5pt",
                      color: c.primary,
                      background: c.light,
                      padding: "2px 8px",
                      borderRadius: "20px",
                      whiteSpace: "nowrap",
                      marginLeft: "8px",
                      flexShrink: 0,
                    }}
                  >
                    {dateRange(edu.start_date, edu.end_date)}
                  </span>
                )}
              </div>
            ))}
          </CreativeSection>
        )}

        {(skills.technical.length > 0 || skills.soft.length > 0) && (
          <CreativeSection title={lbl.skills} color={c.primary} light={c.light}>
            {skills.technical.length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "9pt", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>{lbl.technicalSkills}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {skills.technical.map((sk, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "8.5pt",
                        color: c.primary,
                        background: c.light,
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontWeight: 500,
                      }}
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {skills.soft.length > 0 && (
              <div>
                <div style={{ fontSize: "9pt", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>{lbl.softSkills}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {skills.soft.map((sk, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "8.5pt",
                        color: "#6b7280",
                        background: "#f3f4f6",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontWeight: 500,
                      }}
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CreativeSection>
        )}

        {projects && projects.length > 0 && (
          <CreativeSection title={lbl.projects} color={c.primary} light={c.light}>
            {projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: "12px", paddingLeft: "12px", borderLeft: `3px solid ${c.light}` }}>
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
                    <span style={{ fontSize: "8.5pt", color: c.primary, background: c.light, padding: "2px 8px", borderRadius: "20px", whiteSpace: "nowrap", marginLeft: "8px", flexShrink: 0 }}>
                      {dateRange(proj.start_date, proj.end_date)}
                    </span>
                  )}
                </div>
                {proj.technologies && proj.technologies.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                    {proj.technologies.map((t, ti) => (
                      <span key={ti} style={{ fontSize: "8pt", color: "#6b7280", background: "#f9fafb", border: "1px solid #e5e7eb", padding: "1px 7px", borderRadius: "4px" }}>{t}</span>
                    ))}
                  </div>
                )}
                {proj.description && <BulletList text={proj.description} accentColor={c.primary} />}
              </div>
            ))}
          </CreativeSection>
        )}

        {certifications && certifications.length > 0 && (
          <CreativeSection title={lbl.certifications} color={c.primary} light={c.light}>
            {certifications.map((cert, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
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
          </CreativeSection>
        )}
      </div>
    </div>
  );
}

function CreativeSection({ title, color, light, children }: { title: string; color: string; light: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span style={{ width: "10px", height: "10px", background: color, borderRadius: "50%", flexShrink: 0 }} />
        <h2 style={{ fontSize: "11pt", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.07em", margin: 0 }}>{title}</h2>
        <div style={{ flex: 1, height: "1.5px", background: light }} />
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
          <span style={{ fontSize: "9.5pt", color: "#374151", lineHeight: 1.55 }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}
