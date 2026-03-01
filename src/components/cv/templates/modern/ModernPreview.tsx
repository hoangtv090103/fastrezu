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

export default function ModernPreview({
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
        display: "flex",
        minHeight: "100%",
      }}
    >
      {/* ── Sidebar (30%) ── */}
      <div
        style={{
          width: "30%",
          background: c.primary,
          padding: "28px 16px",
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {/* Photo */}
        {personal.photo_url && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={personal.photo_url}
              alt={personal.full_name}
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid rgba(255,255,255,0.6)",
                flexShrink: 0,
              }}
            />
          </div>
        )}

        {/* Name on sidebar */}
        <h1
          style={{
            fontSize: "14pt",
            fontWeight: 700,
            color: "#fff",
            margin: "0 0 8px",
            lineHeight: 1.3,
            textAlign: personal.photo_url ? "center" : "left",
          }}
        >
          {personal.full_name}
        </h1>

        {/* Contact */}
        <SideSection title="Contact" color={c.light} borderColor="rgba(255,255,255,0.3)">
          {personal.email && <SideItem label="Email" value={personal.email} />}
          {personal.phone && <SideItem label="Phone" value={personal.phone} />}
          {personal.address && <SideItem label="Address" value={personal.address} />}
          {personal.linkedin && <SideItem label="LinkedIn" value={personal.linkedin} />}
          {personal.github && <SideItem label="GitHub" value={personal.github} />}
          {personal.website && <SideItem label="Web" value={personal.website} isLink />}
        </SideSection>

        {/* Skills on sidebar */}
        {(skills.technical.length > 0 || skills.soft.length > 0) && (
          <SideSection title={lbl.skills} color={c.light} borderColor="rgba(255,255,255,0.3)">
            {skills.technical.length > 0 && (
              <div style={{ marginBottom: "6px" }}>
                <div style={{ fontSize: "7pt", fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {lbl.technicalSkills}
                </div>
                {skills.technical.map((sk, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.6)", flexShrink: 0 }} />
                    <span style={{ fontSize: "8pt", color: "#fff" }}>{sk}</span>
                  </div>
                ))}
              </div>
            )}
            {skills.soft.length > 0 && (
              <div>
                <div style={{ fontSize: "7pt", fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {lbl.softSkills}
                </div>
                {skills.soft.map((sk, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.6)", flexShrink: 0 }} />
                    <span style={{ fontSize: "8pt", color: "#fff" }}>{sk}</span>
                  </div>
                ))}
              </div>
            )}
          </SideSection>
        )}

        {/* Education on sidebar */}
        {education.length > 0 && (
          <SideSection title={lbl.education} color={c.light} borderColor="rgba(255,255,255,0.3)">
            {education.map((edu, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "9pt", fontWeight: 700, color: "#fff" }}>{edu.degree}</div>
                {edu.institution && <div style={{ fontSize: "8pt", color: "rgba(255,255,255,0.8)" }}>{edu.institution}</div>}
                {dateRange(edu.start_date, edu.end_date) && (
                  <div style={{ fontSize: "7.5pt", color: "rgba(255,255,255,0.6)" }}>{dateRange(edu.start_date, edu.end_date)}</div>
                )}
                {edu.gpa && <div style={{ fontSize: "7.5pt", color: "rgba(255,255,255,0.6)" }}>{lbl.gpa}: {edu.gpa}</div>}
              </div>
            ))}
          </SideSection>
        )}

        {/* Certifications on sidebar */}
        {certifications && certifications.length > 0 && (
          <SideSection title={lbl.certifications} color={c.light} borderColor="rgba(255,255,255,0.3)">
            {certifications.map((cert, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                <div style={{ fontSize: "9pt", fontWeight: 700, color: "#fff" }}>{cert.name}</div>
                <div style={{ fontSize: "8pt", color: "rgba(255,255,255,0.8)" }}>{cert.organization}</div>
                {cert.issue_date && <div style={{ fontSize: "7.5pt", color: "rgba(255,255,255,0.6)" }}>{cert.issue_date}</div>}
              </div>
            ))}
          </SideSection>
        )}
      </div>

      {/* ── Main (70%) ── */}
      <div style={{ flex: 1, padding: "28px 22px" }}>
        {/* Summary */}
        {summary && (
          <MainSection title={lbl.summary} color={c.primary}>
            <p style={{ fontSize: "9pt", color: "#374151", lineHeight: 1.6, margin: 0 }}>{summary}</p>
          </MainSection>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <MainSection title={lbl.experience} color={c.primary}>
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "10pt", fontWeight: 700, color: "#111827" }}>{exp.title}</span>
                    {exp.company && (
                      <span style={{ fontSize: "9pt", color: c.primary, fontWeight: 600 }}>{" "}@ {exp.company}</span>
                    )}
                  </div>
                  {dateRange(exp.start_date, exp.end_date) && (
                    <span style={{ fontSize: "8pt", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "8px", flexShrink: 0 }}>
                      {dateRange(exp.start_date, exp.end_date)}
                    </span>
                  )}
                </div>
                {exp.description && <BulletList text={exp.description} accentColor={c.primary} />}
              </div>
            ))}
          </MainSection>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <MainSection title={lbl.projects} color={c.primary}>
            {projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "10pt", fontWeight: 700, color: "#111827" }}>{proj.name}</span>
                    {proj.role && <span style={{ fontSize: "9pt", color: "#6b7280" }}>  ·  {proj.role}</span>}
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: "8.5pt", color: c.primary, marginLeft: "8px", textDecoration: "none" }}>
                        ↗ {lbl.viewProject}
                      </a>
                    )}
                  </div>
                  {dateRange(proj.start_date, proj.end_date) && (
                    <span style={{ fontSize: "8pt", color: "#9ca3af", whiteSpace: "nowrap", marginLeft: "8px", flexShrink: 0 }}>
                      {dateRange(proj.start_date, proj.end_date)}
                    </span>
                  )}
                </div>
                {proj.technologies && proj.technologies.length > 0 && (
                  <p style={{ fontSize: "8pt", color: "#6b7280", margin: "2px 0 3px" }}>{proj.technologies.join("  ·  ")}</p>
                )}
                {proj.description && <BulletList text={proj.description} accentColor={c.primary} />}
              </div>
            ))}
          </MainSection>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SideSection({
  title, color, borderColor, children,
}: { title: string; color: string; borderColor: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: `1px solid ${borderColor}`, paddingTop: "10px", marginTop: "12px" }}>
      <h3 style={{ fontSize: "8pt", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px", marginTop: 0 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function SideItem({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div style={{ marginBottom: "5px" }}>
      <div style={{ fontSize: "7pt", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: "8pt", color: "#fff", wordBreak: "break-all" }}>{value}</a>
      ) : (
        <div style={{ fontSize: "8pt", color: "#fff", wordBreak: "break-all" }}>{value}</div>
      )}
    </div>
  );
}

function MainSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <h2 style={{
        fontSize: "10pt", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em",
        borderBottom: `1.5px solid ${color}`, paddingBottom: "2px", marginBottom: "8px", marginTop: "0",
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
    <ul style={{ margin: "3px 0 0", padding: 0, listStyle: "none" }}>
      {lines.map((line, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "5px", marginBottom: "2px" }}>
          <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: accentColor, marginTop: "5px", flexShrink: 0 }} />
          <span style={{ fontSize: "8.5pt", color: "#374151", lineHeight: 1.5 }}>{line}</span>
        </li>
      ))}
    </ul>
  );
}
