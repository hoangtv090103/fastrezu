import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { FeedbackInsert } from '@/types';
import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Helper function to send feedback notification email to team
 */
async function sendFeedbackNotificationEmail(
  feedbackData: {
    id: string;
    feedback_type: string;
    subject: string;
    message: string;
    user_email: string | null;
    priority: string;
    created_at: string;
    feedback_attachments?: Array<{
      file_name: string;
      original_name: string;
      file_type: string;
      file_size: number;
    }>;
  },
  user?: { id: string; email?: string } | null
) {
  // Skip if Resend API key is not configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email notification');
    return;
  }

  // Skip if team email is not configured
  if (!process.env.TEAM_EMAIL) {
    console.warn('TEAM_EMAIL not configured, skipping email notification');
    return;
  }

  const feedbackTypeLabels: Record<string, string> = {
    bug_report: '🐛 Báo lỗi',
    feature_request: '✨ Đề xuất tính năng',
    general_feedback: '💬 Góp ý chung',
    praise: '👏 Khen ngợi',
  };

  const priorityLabels: Record<string, string> = {
    high: '🔴 Cao',
    medium: '🟡 Trung bình',
    low: '🟢 Thấp',
  };

  const feedbackTypeLabel = feedbackTypeLabels[feedbackData.feedback_type] || feedbackData.feedback_type;
  const priorityLabel = priorityLabels[feedbackData.priority] || feedbackData.priority;
  const userInfo = feedbackData.user_email || user?.email || 'Ẩn danh';
  const hasAttachments = feedbackData.feedback_attachments && feedbackData.feedback_attachments.length > 0;

  // Format attachments info
  let attachmentsHtml = '';
  if (hasAttachments) {
    attachmentsHtml = `
      <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #374151;">📎 Tệp đính kèm (${feedbackData.feedback_attachments!.length}):</p>
        <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
          ${feedbackData.feedback_attachments!.map(att => `
            <li style="margin: 5px 0;">
              <strong>${att.original_name}</strong> 
              <span style="color: #9ca3af;">(${(att.file_size / 1024).toFixed(1)} KB)</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
              🔔 Feedback mới từ FastRezu
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 30px 20px;">
            
            <!-- Summary -->
            <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px 20px; margin-bottom: 25px; border-radius: 4px;">
              <p style="margin: 0; font-size: 16px; color: #1e40af; font-weight: 600;">
                ${feedbackTypeLabel} • ${priorityLabel}
              </p>
            </div>

            <!-- Details -->
            <div style="margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600; width: 140px;">Người gửi:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">${userInfo}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600;">Tiêu đề:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600;">${feedbackData.subject}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 600;">Thời gian:</td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827;">
                    ${new Date(feedbackData.created_at).toLocaleString('vi-VN', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </td>
                </tr>
              </table>
            </div>

            <!-- Message -->
            <div style="margin-bottom: 25px;">
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #374151; font-size: 16px;">💬 Nội dung:</p>
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border-left: 3px solid #2563eb;">
                <p style="margin: 0; color: #1f2937; white-space: pre-wrap; line-height: 1.7;">${feedbackData.message}</p>
              </div>
            </div>

            ${attachmentsHtml}

            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/_/editor/feedback?filter=id%3Aeq%3A${feedbackData.id}" 
                 style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                📊 Xem chi tiết trong Database
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              Feedback ID: <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${feedbackData.id}</code>
            </p>
            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
              Email tự động từ FastRezu Feedback System
            </p>
          </div>

        </div>
      </body>
    </html>
  `;

  // Plain text fallback
  const emailText = `
🔔 Feedback mới từ FastRezu

Loại: ${feedbackTypeLabel}
Độ ưu tiên: ${priorityLabel}
Người gửi: ${userInfo}
Tiêu đề: ${feedbackData.subject}
Thời gian: ${new Date(feedbackData.created_at).toLocaleString('vi-VN')}

Nội dung:
${feedbackData.message}

${hasAttachments ? `\nTệp đính kèm: ${feedbackData.feedback_attachments!.length} file` : ''}

Xem chi tiết: ${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/_/editor/feedback

Feedback ID: ${feedbackData.id}
  `.trim();

  // Send email using Resend
  try {
    console.log('📧 Attempting to send feedback notification email...');
    console.log('From:', process.env.RESEND_FROM_EMAIL);
    console.log('To:', process.env.TEAM_EMAIL);
    console.log('Subject:', `🔔 ${feedbackTypeLabel} từ ${userInfo} - ${feedbackData.subject}`);
    
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'FastRezu <onboarding@resend.dev>',
      to: process.env.TEAM_EMAIL!,
      subject: `🔔 ${feedbackTypeLabel} từ ${userInfo} - ${feedbackData.subject}`,
      html: emailHtml,
      text: emailText,
      replyTo: feedbackData.user_email || undefined,
    });
    
    console.log('✅ Email sent successfully:', result);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
}

interface AttachmentData {
  fileName: string;
  fileSize: number;
  fileType: string;
  originalName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedback_type, subject, message, user_email, priority, metadata } = body;

    // Validation
    if (!feedback_type || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: feedback_type, subject, message' },
        { status: 400 }
      );
    }

    if (!['bug_report', 'feature_request', 'general_feedback', 'praise'].includes(feedback_type)) {
      return NextResponse.json(
        { error: 'Invalid feedback_type' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              console.error('Error setting cookies:', error);
            }
          },
        },
      }
    );

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    const feedbackData: FeedbackInsert = {
      user_id: user?.id || null,
      user_email: user_email || user?.email || null,
      feedback_type,
      subject,
      message,
      priority: priority || 'medium',
      status: 'open',
      metadata: metadata || {},
    };

    // Insert feedback first
    const { data: feedbackRecord, error: feedbackError } = await supabase
      .from('feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (feedbackError) {
      console.error('Error inserting feedback:', feedbackError);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    // Handle attachments if provided
    const attachments = body.attachments;
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attachmentRecords = attachments.map((attachment: AttachmentData) => ({
        feedback_id: feedbackRecord.id,
        file_name: attachment.fileName,
        file_path: attachment.fileName, // This should be the full path in storage
        file_size: attachment.fileSize,
        file_type: attachment.fileType,
        original_name: attachment.originalName,
        uploaded_by: user?.id || null,
      }));

      const { error: attachmentsError } = await supabase
        .from('feedback_attachments')
        .insert(attachmentRecords);

      if (attachmentsError) {
        console.error('Error inserting attachments:', attachmentsError);
        // Don't fail the whole request if attachments fail, just log it
      }
    }

    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        feedback_attachments (
          id,
          file_name,
          original_name,
          file_type,
          file_size,
          created_at
        )
      `)
      .eq('id', feedbackRecord.id)
      .single();

    if (error) {
      console.error('Error inserting feedback:', error);
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    // Send email notification to team (non-blocking)
    try {
      await sendFeedbackNotificationEmail(data, user);
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error('Failed to send notification email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      data
    });

  } catch (error) {
    console.error('Error in feedback API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch (error) {
              console.error('Error setting cookies:', error);
            }
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        feedback_attachments (
          id,
          file_name,
          original_name,
          file_type,
          file_size,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error('Error in feedback API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
