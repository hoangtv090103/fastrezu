import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { extractText, getDocumentProxy } from "unpdf";
const mammoth = require("mammoth");

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
    const file = (formData as any).get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Upload original file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("cv-uploads")
      .upload(fileName, file, {
        contentType: file.type,
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
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
        const { text } = await extractText(pdf, { mergePages: true });
        extractedText = text;
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await file.arrayBuffer();
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
        fileSize: file.size,
        fileType: file.type,
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
