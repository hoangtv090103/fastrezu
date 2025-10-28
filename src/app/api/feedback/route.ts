import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

type FeedbackInsert = Database['public']['Tables']['feedback']['Insert'];

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
