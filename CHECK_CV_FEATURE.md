# Check CV Feature - V1 Beta

## Overview
The `/check-cv` page is a standalone experimental feature that allows users to upload their existing CV (PDF/DOCX), review and correct the extracted text, optionally provide a Job Description, and receive an ATS score.

## Features Implemented

### 1. File Upload & Text Extraction
- **Supported formats**: PDF and DOCX files
- **File size limit**: 10MB
- **Text extraction**: Uses `unpdf` for PDF (serverless-optimized) and `mammoth` for DOCX
- **Storage**: Original files saved to Supabase Storage in `cv-uploads` bucket

### 2. Text Review & Correction
- **Simple textarea interface**: Users can review and edit extracted text
- **Accuracy disclaimer**: Clear messaging about extraction limitations
- **User confirmation**: Required before proceeding to scoring

### 3. Job Description Input (Optional)
- **Optional JD textarea**: Users can paste job descriptions for better scoring
- **Enhanced scoring**: More accurate ATS scores when JD is provided

### 4. ATS Scoring
- **Comprehensive scoring**: Based on existing AI scoring logic
- **Score breakdown**: Keyword match, formatting, completeness, relevance
- **Actionable feedback**: Matched/missing keywords and improvement suggestions
- **Language support**: Vietnamese (default) and English

## Technical Implementation

### API Routes
1. **`/api/cv/upload-check`**: Handles file upload and text extraction
2. **`/api/ai/score-uploaded-cv`**: Performs ATS scoring on corrected text

### Frontend Components
- **`/check-cv/page.tsx`**: Main component with 4-step wizard interface
- **Step indicators**: Visual progress tracking
- **Error handling**: Comprehensive error messages and validation

### Database & Storage
- **Supabase Storage**: `cv-uploads` bucket with RLS policies
- **File organization**: Files stored in user-specific folders (`{user_id}/{timestamp}.{ext}`)
- **Security**: Users can only access their own files

## Setup Instructions

### 1. Install Dependencies
```bash
bun add unpdf mammoth
```

### 2. Create Storage Bucket
Run the SQL script in Supabase Dashboard:
```sql
-- See setup-storage.sql for complete script
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cv-uploads', 'cv-uploads', false, 10485760, 
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
```

### 3. Configure RLS Policies
The setup script includes policies for:
- Upload files to user's folder
- Read own files
- Delete own files
- Update own files

## User Flow

1. **Upload**: User selects PDF/DOCX file and uploads
2. **Review**: System extracts text, user reviews and corrects in textarea
3. **Job Description**: User optionally pastes JD for better scoring
4. **Results**: System displays ATS score, analysis, and suggestions

## Limitations (V1 Beta)

- **Text extraction accuracy**: May vary for complex layouts (e.g., Canva PDFs)
- **No file preview**: Only plain text extraction, no visual preview
- **No persistent storage**: Scoring results not saved (can be added later)
- **Simple textarea**: No rich text editor for corrections

## Future Enhancements (V2)

- Advanced PDF parsing with layout preservation
- Side-by-side file preview
- Rich text editor for corrections
- Persistent scoring history
- Multiple file format support
- Batch processing capabilities

## Security Considerations

- All operations require authentication
- Files stored with user-specific paths
- RLS policies prevent cross-user access
- File type and size validation
- Error handling for malicious files

## Testing

1. Navigate to `/check-cv` (requires authentication)
2. Upload a PDF or DOCX file
3. Review and correct extracted text
4. Optionally add job description
5. Get ATS score and feedback

## Error Handling

- File type validation
- File size limits
- Text extraction failures
- Authentication errors
- API rate limiting
- Storage quota limits
