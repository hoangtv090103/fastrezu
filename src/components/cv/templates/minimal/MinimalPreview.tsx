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

export default function MinimalPreview({
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
        color: "#1a1a1a",
        padding: "40px 48px",
        width: "100%",
        maxWidth: "794px",
        margin: "0 auto",
        boxSizing: "border-box",
        lineHeight: 1.5,
      }}
    >
      {/* ── Header — ultra clean ── */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22pt", fontWeight: 400, color: "#1a1a1a", margin: "0 0 6px", letterSpacing: "-0.5px" }}>
          {personal.full_name}
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "9pt", color: "#6b7280" }}>
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.address && <span>{personal.address}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github && <span>{personal.github}</span>}
          {personal.website && (
            <a href={personal.website} target="_blank" rel="noopener noreferrer"
              style={{ color: c.primary, textDecoration: "none" }}>{personal.website}</a>
          )}
        </div>
      </div>

      <div style={{ height: "1px", background: "#1a1a1a", marginBottom: "20px" }} />

      {/* Summary */}
      {summary && (
        <MinSection title={lbl.summary} color={c.primary}>
          <p style={{ fontSize: "9.5pt", color: "#374151", lineHeight: 1.7, margin: 0 }}>{summary}</p>
        </MinSection>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <MinSection title={lbl.experience} color={c.primary}>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "10pt", fontWeight: 700, color: "#1a1a1a" }}>{exp.title}</span>
                  {exp.company && <span style={{ fontSize: "9.5pt", color: "#6b7280" }}>, {exp.company}</span>}
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
        </MinSection>
      )}

      {/* Education */}
      {education.length > 0 && (
        <MinSection title={lbl.education} color={c.primary}>
          {education.map((edu, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "7px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "10pt", fontWeight: 700, color: "#1a1a1a" }}>{edu.degree}</span>
                {edu.institution && <span style={{ fontSize: "9.5pt", color: "#6b7280" }}>, {edu.institution}</span>}
                {edu.gpa && <span style={{ fontSize: "9pt", color: "#9ca3af" }}>  |  {lbl.gpa}: {edu.gpa}</span>}
              </div>
              {dateRange(edu.start_date, edu.end_date) && (
                <span style={{ fontSize: "9pt", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "8px", flexShrink: 0 }}>
                  {dateRange(edu.start_date, edu.end_date)}
                </span>
              )}
            </div>
          ))}
        </MinSection>
      )}

      {/* Skills */}
      {(skills.technical.length > 0 || skills.soft.length > 0) && (
        <MinSection title={lbl.skills} color={c.primary}>
          {skills.technical.length > 0 && (
            <div style={{ marginBottom: "4px", fontSize: "9.5pt" }}>
              <span style={{ fontWeight: 700, color: "#1a1a1a" }}>{lbl.technicalSkills}: </span>
              <span style={{ color: "#6b7280" }}>{skills.technical.join(", ")}</span>
            </div>
          )}
          {skills.soft.length > 0 && (
            <div style={{ fontSize: "9.5pt" }}>
              <span style={{ fontWeight: 700, color: "#1a1a1a" }}>{lbl.softSkills}: </span>
              <span style={{ color: "#6b7280" }}>{skills.soft.join(", ")}</span>
            </div>
          )}
        </MinSection>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <MinSection title={lbl.projects} color={c.primary}>
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "10pt", fontWeight: 700, color: "#1a1a1a" }}>{proj.name}</span>
                  {proj.role && <span style={{ fontSize: "9.5pt", color: "#6b7280" }}>, {proj.role}</span>}
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
                <p style={{ fontSize: "9pt", color: "#9ca3af", margin: "2px 0 3px" }}>{proj.technologies.join(", ")}</p>
              )}
              {proj.description && <BulletList text={proj.description} accentColor={c.primary} />}
            </div>
          ))}
        </MinSection>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <MinSection title={lbl.certifications} color={c.primary}>
          {certifications.map((cert, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <span style={{ fontSize: "10pt", fontWeight: 700, color: "#1a1a1a" }}>{cert.name}</span>
              <span style={{ fontSize: "9.5pt", color: "#6b7280" }}>, {cert.organization}</span>
              {cert.issue_date && <span style={{ fontSize: "9pt", color: "#9ca3af" }}>  ·  {cert.issue_date}</span>}
              {cert.credential_url && (
                <a href={cert.credential_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "9pt", color: c.primary, marginLeft: "8px" }}>↗</a>
              )}
            </div>
          ))}
        </MinSection>
      )}
    </div>
  );
}

function MinSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
        <h2 style={{ fontSize: "9pt", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>{title}</h2>
        <div style={{ flex: 1, height: "0.5px", background: "#d1d5db" }} />
      </div>
      {children}
    </div>
  );
}

function BulletList({ text, accentColor }: { text: string; accentColor: string }) {
  const lines = parseBullets(text);
  return (
    <ul style={{ margin: "4px 0 0", padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "3px" }}>
          <span style={{ fontSize: "9pt", color: accentColor, marginTop: "1px", flexShrink: 0 }}>–</span>
          <span style={{ fontSize: "9.5pt", color: "#374151", lineHeight: 1.55 }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}
