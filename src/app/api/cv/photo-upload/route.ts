import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const BUCKET = "profile-photos";
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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
            } catch {
              // ignore in Server Components
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = (formData as unknown as { get: (key: string) => File | null }).get("file");

    if (!file) {
      return NextResponse.json({ error: "Không có file được gửi lên" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Chỉ hỗ trợ định dạng JPG, PNG, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Kích thước ảnh không được vượt quá 5MB" },
        { status: 400 }
      );
    }

    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const storagePath = `${user.id}/avatar.${ext}`;

    // Upload (upsert — always overwrites previous photo)
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Lỗi khi tải ảnh lên. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

    // Add cache-busting so browser always shows the latest avatar
    const publicUrlWithBust = `${publicUrl}?t=${Date.now()}`;

    // Merge photo_url into existing personal data in master_profiles
    const { data: existingRow } = await supabase
      .from("master_profiles")
      .select("content")
      .eq("user_id", user.id)
      .eq("section_type", "personal")
      .maybeSingle();

    const existingPersonal =
      existingRow?.content && typeof existingRow.content === "object"
        ? (existingRow.content as Record<string, unknown>)
        : {};

    await supabase.from("master_profiles").upsert(
      {
        user_id: user.id,
        section_type: "personal",
        content: { ...existingPersonal, photo_url: publicUrlWithBust },
      },
      { onConflict: "user_id,section_type" }
    );

    return NextResponse.json({ publicUrl: publicUrlWithBust });
  } catch (error) {
    console.error("Photo upload API error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
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
            } catch {
              // ignore in Server Components
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove photo from storage (try all extensions)
    const extensions = ["jpg", "png", "webp"];
    for (const ext of extensions) {
      await supabase.storage
        .from(BUCKET)
        .remove([`${user.id}/avatar.${ext}`]);
    }

    // Clear photo_url from master_profiles personal section
    const { data: existingRow } = await supabase
      .from("master_profiles")
      .select("content")
      .eq("user_id", user.id)
      .eq("section_type", "personal")
      .maybeSingle();

    if (existingRow?.content && typeof existingRow.content === "object") {
      const updated = { ...(existingRow.content as Record<string, unknown>) };
      delete updated.photo_url;

      await supabase.from("master_profiles").upsert(
        {
          user_id: user.id,
          section_type: "personal",
          content: updated,
        },
        { onConflict: "user_id,section_type" }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Photo delete API error:", error);
    return NextResponse.json(
      { error: "Lỗi máy chủ. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
