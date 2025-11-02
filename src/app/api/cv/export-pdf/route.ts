import { NextRequest } from 'next/server';
import puppeteer, { Browser } from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { CVData } from '@/contexts/CVEditorContext';
import { AppError, logError, ERROR_MESSAGES } from '@/lib/error-handler';

// Create a server-side PDF template component
const createPDFTemplate = (cvData: CVData): string => {
  const labels = cvData.language === 'vi' ? {
    fullName: "Họ và tên",
    professionalSummary: "Tóm tắt nghề nghiệp",
    workExperience: "Kinh nghiệm làm việc",
    education: "Học vấn",
    projects: "Dự án",
    skills: "Kỹ năng",
    certifications: "Chứng chỉ",
    jobTitle: "Chức vụ",
    timePeriod: "Thời gian",
    company: "Tên công ty",
    location: "Địa điểm",
    degree: "Bằng cấp",
    graduationDate: "Năm tốt nghiệp",
    school: "Tên trường",
    fieldOfStudy: "Chuyên ngành",
    projectName: "Tên dự án",
    viewProject: "Xem dự án",
    technologies: "Công nghệ",
    technicalSkills: "Kỹ năng chuyên môn",
    softSkills: "Kỹ năng mềm",
    certificationName: "Tên chứng chỉ",
    issueDate: "Ngày cấp",
    issuingOrganization: "Tổ chức cấp"
  } : {
    fullName: "Full Name",
    professionalSummary: "Professional Summary",
    workExperience: "Work Experience",
    education: "Education",
    projects: "Projects",
    skills: "Skills",
    certifications: "Certifications",
    jobTitle: "Job Title",
    timePeriod: "Time Period",
    company: "Company",
    location: "Location",
    degree: "Degree",
    graduationDate: "Graduation Date",
    school: "School",
    fieldOfStudy: "Field of Study",
    projectName: "Project Name",
    viewProject: "View Project",
    technologies: "Technologies",
    technicalSkills: "Technical Skills",
    softSkills: "Soft Skills",
    certificationName: "Certification Name",
    issueDate: "Issue Date",
    issuingOrganization: "Issuing Organization"
  };

  // Safely access sections with fallbacks
  const sections = cvData.sections || {};
  const personalInfo = (sections.personal_info as Record<string, unknown>) || {};
  const summary = (sections.summary as Record<string, unknown>) || {};
  const experience = (sections.experience as unknown as Record<string, unknown>[]) || [];
  const education = (sections.education as unknown as Record<string, unknown>[]) || [];
  const projects = (sections.projects as unknown as Record<string, unknown>[]) || [];
  const skills = (sections.skills as Record<string, unknown>) || {};
  const certifications = (sections.certifications as unknown as Record<string, unknown>[]) || [];

  // Helper function to safely get string values
  const getString = (obj: Record<string, unknown>, key: string): string => {
    const value = obj[key];
    return typeof value === 'string' ? value : '';
  };

  // Helper to safely render unknown values
  const renderValue = (value: unknown): string => {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    return '';
  };

  return `
    <!DOCTYPE html>
    <html lang="${cvData.language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${getString(personalInfo, 'full_name') || labels.fullName} - CV</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #111827;
          background: white;
          padding: 20mm;
          width: 210mm;
          min-height: 297mm;
        }

        .cv-container {
          max-width: 170mm;
          margin: 0 auto;
        }

        /* Header styles */
        .header {
          text-align: center;
          margin-bottom: 24px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 16px;
        }

        .name {
          font-size: 20pt;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
          color: #111827;
        }

        .contact-info {
          font-size: 10pt;
          color: #6b7280;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .contact-info span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .contact-info .dot {
          width: 4px;
          height: 4px;
          background-color: #2563eb;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .links {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .links a {
          color: #2563eb;
          text-decoration: none;
          font-size: 10pt;
        }

        .links a:hover {
          text-decoration: underline;
        }

        /* Section styles */
        .section {
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 14pt;
          font-weight: 700;
          color: #2563eb;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 4px;
          margin-bottom: 24px;
        }

        .subsection {
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .subsection:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .job-title {
          font-size: 12pt;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .time-period {
          font-size: 10pt;
          color: #6b7280;
          background-color: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
        }

        .company-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .company-name {
          font-size: 11pt;
          font-weight: 600;
          color: #2563eb;
        }

        .location {
          font-size: 10pt;
          color: #6b7280;
        }

        .achievements {
          font-size: 10pt;
          line-height: 1.6;
          color: #374151;
        }

        .achievement-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .achievement-bullet {
          width: 6px;
          height: 6px;
          background-color: #2563eb;
          border-radius: 50%;
          margin-top: 6px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .achievement-text {
          flex: 1;
        }

        /* Education styles */
        .education-item {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f3f4f6;
        }

        .education-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .degree {
          font-size: 12pt;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .education-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .school-name {
          font-size: 11pt;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 4px;
        }

        .field-study {
          font-size: 10pt;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .gpa {
          font-size: 10pt;
          color: #6b7280;
        }

        /* Projects styles */
        .project-item {
          margin-bottom: 16px;
        }

        .project-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .project-name {
          font-size: 11pt;
          font-weight: 700;
          color: #111827;
        }

        .project-link {
          font-size: 10pt;
          color: #2563eb;
          text-decoration: none;
        }

        .project-link:hover {
          text-decoration: underline;
        }

        .project-description {
          font-size: 10pt;
          color: #374151;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .project-tech {
          font-size: 10pt;
          color: #6b7280;
        }

        /* Skills styles */
        .skills-section {
          margin-bottom: 12px;
        }

        .skills-title {
          font-size: 11pt;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .skills-list {
          font-size: 10pt;
          color: #374151;
        }

        /* Certifications styles */
        .cert-item {
          margin-bottom: 12px;
        }

        .cert-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .cert-name {
          font-size: 11pt;
          font-weight: 700;
          color: #111827;
        }

        .cert-date {
          font-size: 10pt;
          color: #6b7280;
        }

        .cert-org {
          font-size: 11pt;
          font-weight: 600;
          color: #2563eb;
          margin-bottom: 4px;
        }

        .cert-id {
          font-size: 10pt;
          color: #6b7280;
        }

        /* Professional Summary styles */
        .summary-text {
          font-size: 11pt;
          line-height: 1.6;
          color: #374151;
        }

        /* Page break rules for PDF export */
        .subsection {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .education-item {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .project-item {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .cert-item {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .section-title {
          page-break-after: avoid;
          break-after: avoid;
        }

        .achievement-item {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        /* Print styles */
        @media print {
          body {
            padding: 0;
            width: auto;
            min-height: auto;
          }

          .cv-container {
            max-width: none;
            margin: 0;
          }

          .subsection:last-child,
          .education-item:last-child {
            border-bottom: none;
          }
        }

        @page {
          size: A4;
          margin: 20mm;
        }
      </style>
    </head>
    <body>
      <div class="cv-container">
        <!-- Header -->
        <div class="header">
          <div class="name">${getString(personalInfo, 'full_name') || labels.fullName}</div>
          <div class="contact-info">
            ${getString(personalInfo, 'email') ? `<span><span class="dot"></span>${getString(personalInfo, 'email')}</span>` : ''}
            ${getString(personalInfo, 'phone') ? `<span><span class="dot"></span>${getString(personalInfo, 'phone')}</span>` : ''}
            ${getString(personalInfo, 'location') ? `<span><span class="dot"></span>${getString(personalInfo, 'location')}</span>` : ''}
          </div>
          <div class="links">
            ${getString(personalInfo, 'linkedin') ? `<a href="${getString(personalInfo, 'linkedin')}">LinkedIn: ${getString(personalInfo, 'linkedin')}</a>` : ''}
            ${getString(personalInfo, 'portfolio') ? `<a href="${getString(personalInfo, 'portfolio')}">Portfolio: ${getString(personalInfo, 'portfolio')}</a>` : ''}
          </div>
        </div>

        <!-- Professional Summary -->
        ${getString(summary, 'content') ? `
        <div class="section">
          <div class="section-title">${labels.professionalSummary}</div>
          <div class="summary-text">${getString(summary, 'content').replace(/\n/g, '<br>')}</div>
        </div>
        ` : ''}

        <!-- Work Experience -->
        ${experience.length > 0 ? `
        <div class="section">
          <div class="section-title">${labels.workExperience}</div>
          ${experience.map((exp: Record<string, unknown>) => `
          <div class="subsection">
            <div class="job-header">
              <div class="job-title">${renderValue(exp.job_title) || labels.jobTitle}</div>
              <div class="time-period">
                ${exp.start_date && exp.end_date ? `${renderValue(exp.start_date)} - ${renderValue(exp.end_date)}` : labels.timePeriod}
              </div>
            </div>
            <div class="company-info">
              <div class="company-name">${renderValue(exp.company) || labels.company}</div>
              <div class="location">${renderValue(exp.location) || labels.location}</div>
            </div>
            ${Array.isArray(exp.achievements) && exp.achievements.length > 0 ? `
            <div class="achievements">
              ${exp.achievements.map((achievement: string) => `
              <div class="achievement-item">
                <div class="achievement-bullet"></div>
                <div class="achievement-text">${achievement.replace(/\n/g, '<br>')}</div>
              </div>
              `).join('')}
            </div>
            ` : ''}
          </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Education -->
        ${education.length > 0 ? `
        <div class="section">
          <div class="section-title">${labels.education}</div>
          ${education.map((edu: Record<string, unknown>) => `
          <div class="education-item">
            <div class="education-header">
              <div class="degree">${renderValue(edu.degree) || labels.degree}</div>
              <div class="time-period">${renderValue(edu.graduation_date) || labels.graduationDate}</div>
            </div>
            <div class="school-name">${renderValue(edu.school) || labels.school}</div>
            ${renderValue(edu.field_of_study) ? `<div class="field-study">${labels.fieldOfStudy}: ${renderValue(edu.field_of_study)}</div>` : ''}
            ${renderValue(edu.gpa) ? `<div class="gpa">GPA: ${renderValue(edu.gpa)}</div>` : ''}
          </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Projects -->
        ${projects.length > 0 ? `
        <div class="section">
          <div class="section-title">${labels.projects}</div>
          ${projects.map((project: Record<string, unknown>) => `
          <div class="project-item">
            <div class="project-header">
              <div class="project-name">${renderValue(project.name) || labels.projectName}</div>
              ${renderValue(project.link) ? `<a href="${String(project.link)}" class="project-link">${labels.viewProject}</a>` : ''}
            </div>
            ${renderValue(project.description) ? `<div class="project-description">${String(renderValue(project.description)).replace(/\n/g, '<br>')}</div>` : ''}
            ${renderValue(project.technologies) ? `<div class="project-tech">${labels.technologies}: ${renderValue(project.technologies)}</div>` : ''}
          </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Skills -->
        ${((Array.isArray(skills.technical) && skills.technical.length > 0) || (Array.isArray(skills.soft) && skills.soft.length > 0)) ? `
        <div class="section">
          <div class="section-title">${labels.skills}</div>
          ${Array.isArray(skills.technical) && skills.technical.length > 0 ? `
          <div class="skills-section">
            <div class="skills-title">${labels.technicalSkills}:</div>
            <div class="skills-list">${(skills.technical as string[]).join(', ')}</div>
          </div>
          ` : ''}
          ${Array.isArray(skills.soft) && skills.soft.length > 0 ? `
          <div class="skills-section">
            <div class="skills-title">${labels.softSkills}:</div>
            <div class="skills-list">${(skills.soft as string[]).join(', ')}</div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <!-- Certifications -->
        ${certifications.length > 0 ? `
        <div class="section">
          <div class="section-title">${labels.certifications}</div>
          ${certifications.map((cert: Record<string, unknown>) => `
          <div class="cert-item">
            <div class="cert-header">
              <div class="cert-name">${renderValue(cert.name) || labels.certificationName}</div>
              <div class="cert-date">${renderValue(cert.date) || labels.issueDate}</div>
            </div>
            <div class="cert-org">${renderValue(cert.issuing_organization) || labels.issuingOrganization}</div>
            ${renderValue(cert.credential_id) ? `<div class="cert-id">ID: ${renderValue(cert.credential_id)}</div>` : ''}
          </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
};

export async function POST(request: NextRequest) {
  let browser: Browser | null = null;
  const language = 'vi'; // Default language for error messages
  
  try {
    const { cvData }: { cvData: CVData } = await request.json();

    if (!cvData) {
      return new Response(JSON.stringify({ 
        error: ERROR_MESSAGES[language].validation_error 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate HTML template
    const htmlTemplate = createPDFTemplate(cvData);

    // Try to launch Puppeteer with comprehensive error handling
    try {
      // Check if running in production (Vercel/serverless)
      const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
      
      // Get executable path
      let executablePath: string | undefined;
      if (isProduction) {
        // For Vercel/serverless, use @sparticuz/chromium with correct path
        try {
          executablePath = await chromium.executablePath('/tmp/chromium');
        } catch (chromiumError) {
          console.error('Chromium executable path error:', chromiumError);
          throw new Error('Failed to locate Chromium executable in serverless environment');
        }
      } else {
        // For local development, try to find Chrome
        const possiblePaths = [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', // Windows 32-bit
          '/usr/bin/google-chrome', // Linux
          '/usr/bin/chromium-browser', // Linux Chromium
        ];
        
        for (const path of possiblePaths) {
          try {
            const fs = await import('fs');
            if (fs.existsSync(path)) {
              executablePath = path;
              break;
            }
          } catch {
            // Continue to next path
          }
        }
      }
      
      browser = await puppeteer.launch({
        args: isProduction 
          ? [
              ...chromium.args,
              '--disable-web-security',
              '--disable-features=IsolateOrigins,site-per-process',
            ]
          : [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
            ],
        defaultViewport: {
          width: 1920,
          height: 1080,
        },
        executablePath,
        headless: true,
      });
    } catch (puppeteerError) {
      const error = new AppError(
        'Puppeteer launch failed',
        'PDF_EXPORT_FAILED',
        ERROR_MESSAGES[language].pdf_export_failed,
        false,
        { error: puppeteerError instanceof Error ? puppeteerError.message : 'Unknown error' }
      );
      logError(error);
      
      return new Response(JSON.stringify({
        error: error.userMessage,
        suggestion: language === 'vi' 
          ? 'Vui lòng thử sao chép nội dung dưới dạng văn bản thay thế.'
          : 'Please try copying the content as text instead.',
        fallbackAvailable: true
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set timeout for PDF generation
    const timeoutMs = 30000; // 30 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('PDF generation timeout')), timeoutMs);
    });

    try {
      // Race between PDF generation and timeout
      const pdfBuffer = await Promise.race([
        (async () => {
          const page = await browser.newPage();

          // Set viewport for consistent rendering
          await page.setViewport({ width: 794, height: 1123 }); // A4 at 96 DPI

          // Set HTML content
          await page.setContent(htmlTemplate, { waitUntil: 'networkidle0' });

          // Wait a bit for any dynamic content
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Generate PDF
          return await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
              top: '20mm',
              right: '20mm',
              bottom: '20mm',
              left: '20mm',
            },
            preferCSSPageSize: false,
          });
        })(),
        timeoutPromise
      ]);

      // Close browser
      if (browser) {
        await browser.close();
      }

      // Generate filename
      const sanitizedTitle = (cvData.title || 'CV').replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const fileName = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.pdf`;

      // Return PDF as response
      const buffer = Buffer.from(pdfBuffer as Buffer);
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    } catch (pdfError) {
      // Close browser on error
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }

      // Handle timeout specifically
      if (pdfError instanceof Error && pdfError.message === 'PDF generation timeout') {
        const error = new AppError(
          'PDF generation timeout',
          'PDF_GENERATION_TIMEOUT',
          ERROR_MESSAGES[language].pdf_generation_timeout,
          true
        );
        logError(error);
        
        return new Response(JSON.stringify({
          error: error.userMessage,
          suggestion: language === 'vi'
            ? 'Vui lòng thử lại hoặc sao chép nội dung dưới dạng văn bản.'
            : 'Please try again or copy the content as text.',
          fallbackAvailable: true
        }), {
          status: 504,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      throw pdfError;
    }

  } catch (error) {
    // Clean up browser if still open
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }

    // Handle general errors
    const appError = new AppError(
      error instanceof Error ? error.message : 'Unknown error',
      'PDF_EXPORT_FAILED',
      ERROR_MESSAGES[language].pdf_export_failed,
      false,
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
    logError(appError);
    
    return new Response(JSON.stringify({
      error: appError.userMessage,
      suggestion: language === 'vi'
        ? 'Vui lòng thử sao chép nội dung dưới dạng văn bản thay thế.'
        : 'Please try copying the content as text instead.',
      fallbackAvailable: true
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
