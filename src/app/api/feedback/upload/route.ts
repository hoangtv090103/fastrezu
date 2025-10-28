import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Type assertion to ensure we have the correct File type
    const fileObj = file;

    // Validate file type (images only)
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!allowedTypes.includes(fileObj.type)) {
      return NextResponse.json(
        {
          error: 'Only image files are allowed (JPEG, PNG, GIF, WebP). Maximum size: 5MB'
        },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit for images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileObj.size > maxSize) {
      return NextResponse.json(
        {
          error: 'File size must be less than 5MB'
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = fileObj.name.split('.').pop();
    const fileName = `${user?.id || 'anonymous'}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('feedback-attachments')
      .upload(fileName, fileObj, {
        contentType: fileObj.type,
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
      fileSize: fileObj.size,
      fileType: fileObj.type,
      originalName: fileObj.name,
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
