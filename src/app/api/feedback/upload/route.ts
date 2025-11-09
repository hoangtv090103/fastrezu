import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateFeedbackImageUpload } from '@/lib/validation-schemas';

export async function POST(request: NextRequest) {
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

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Get form data
    const formData = await request.formData();
    const file = (formData as unknown as { get: (key: string) => File | null }).get('file');

    // Validate file using helper function
    const fileValidation = validateFeedbackImageUpload(file);
    if (!fileValidation.success) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    const validatedFile = fileValidation.file;

    // Generate unique filename
    const fileExt = validatedFile.name.split('.').pop();
    const fileName = `${user?.id || 'anonymous'}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('feedback-attachments')
      .upload(fileName, validatedFile, {
        contentType: validatedFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('feedback-attachments')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      fileName,
      fileSize: validatedFile.size,
      fileType: validatedFile.type,
      originalName: validatedFile.name,
      publicUrl,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Feedback upload API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
