import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";
import { validateCVFileUpload } from "@/lib/validation-schemas";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = (formData as unknown as { get: (key: string) => File | null }).get("file");

    // Validate file using helper function
    const fileValidation = validateCVFileUpload(file);
    if (!fileValidation.success) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    const validatedFile = fileValidation.file;

    // Upload original file to Supabase Storage
    const fileExt = validatedFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("cv-uploads")
      .upload(fileName, validatedFile, {
        contentType: validatedFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to save file" },
        { status: 500 }
      );
    }

    // Extract text based on file type
    let extractedText = "";

    try {
      if (validatedFile.type === "application/pdf") {
        const arrayBuffer = await validatedFile.arrayBuffer();
        const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
        const { text } = await extractText(pdf, { mergePages: true });
        extractedText = text;
      } else if (validatedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await validatedFile.arrayBuffer();
        const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
        extractedText = result.value;
      }

      // Clean up the extracted text
      extractedText = extractedText
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, "\n") // Replace multiple newlines with single newline
        .trim();

      if (!extractedText || extractedText.length < 10) {
        return NextResponse.json(
          { error: "Could not extract meaningful text from the file. The file might be corrupted or contain only images." },
          { status: 400 }
        );
      }

      return NextResponse.json({
        extractedText,
        fileName,
        fileSize: validatedFile.size,
        fileType: validatedFile.type,
      });

    } catch (extractionError) {
      console.error("Text extraction error:", extractionError);
      return NextResponse.json(
        { error: "Failed to extract text from file. Please try a different file or check if the file is not corrupted." },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Upload check API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
