# Feedback Email Attachments Feature

## Tổng quan
Tính năng gửi email feedback đã được cập nhật để bao gồm các file đính kèm (attachments) trong email thông báo gửi tới team.

## Các thay đổi đã thực hiện

### 1. Sửa lỗi font nút "Gửi phản hồi"
**File**: `src/components/ui/FeedbackForm.tsx`

**Vấn đề**: Emoji 📤 và text "Gửi phản hồi" được tách thành 2 `<span>` riêng biệt, gây ra lỗi hiển thị font khi nhấn vào nút.

**Giải pháp**: Gộp emoji và text vào cùng một `<span>` duy nhất.

```tsx
// Trước
<>
  <span>📤</span>
  <span>Gửi phản hồi</span>
</>

// Sau
<span>📤 Gửi phản hồi</span>
```

### 2. Thêm tính năng đính kèm attachment vào email
**File**: `src/app/api/feedback/route.ts`

#### Cập nhật hàm `sendFeedbackNotificationEmail`

**Thay đổi chính**:
1. Thêm tham số `supabaseClient` để có thể tải file từ Supabase Storage
2. Thêm `file_path` vào interface của `feedback_attachments`
3. Tải các file attachments từ Supabase Storage
4. Chuyển đổi file từ Blob sang Buffer
5. Đính kèm files vào email khi gửi qua Resend API

**Code snippet quan trọng**:

```typescript
// Tải và chuẩn bị attachments
const emailAttachments: Array<{
  content: Buffer;
  filename: string;
}> = [];

if (hasAttachments && supabaseClient) {
  for (const attachment of feedbackData.feedback_attachments!) {
    try {
      // Download file từ Supabase Storage
      const { data: fileData, error: downloadError } = await supabaseClient.storage
        .from('feedback-attachments')
        .download(attachment.file_name);

      if (downloadError) {
        console.error(`Failed to download ${attachment.file_name}:`, downloadError);
        continue;
      }

      // Convert Blob to Buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      emailAttachments.push({
        content: buffer,
        filename: attachment.original_name,
      });

      console.log(`✓ Successfully prepared attachment: ${attachment.original_name}`);
    } catch (error) {
      console.error(`Error processing attachment ${attachment.file_name}:`, error);
    }
  }
}

// Gửi email với attachments
const result = await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL || 'FastRezu <onboarding@resend.dev>',
  to: process.env.TEAM_EMAIL!,
  subject: `🔔 ${feedbackTypeLabel} từ ${userInfo} - ${feedbackData.subject}`,
  html: emailHtml,
  text: emailText,
  replyTo: feedbackData.user_email || undefined,
  attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
});
```

#### Cập nhật POST endpoint
- Thêm `file_path` vào query select của `feedback_attachments`
- Truyền `supabaseClient` vào hàm `sendFeedbackNotificationEmail(data, user, supabase)`

#### Cập nhật GET endpoint
- Thêm `file_path` vào query select để đảm bảo tính nhất quán

## Cách hoạt động

### Luồng xử lý Feedback với Attachments

```
1. User upload ảnh → FeedbackImageUpload
                   ↓
2. File được upload → /api/feedback/upload
                   ↓
3. Lưu vào Supabase Storage ('feedback-attachments' bucket)
                   ↓
4. Trả về metadata (fileName, publicUrl, fileSize, fileType)
                   ↓
5. User submit feedback → /api/feedback (POST)
                   ↓
6. Lưu feedback vào DB
                   ↓
7. Lưu attachment metadata vào feedback_attachments table
                   ↓
8. Tải files từ Supabase Storage
                   ↓
9. Convert files sang Buffer format
                   ↓
10. Gửi email qua Resend API với attachments
```

## Resend API - Email Attachments

Theo tài liệu của Resend, attachments được định dạng như sau:

```typescript
attachments: [
  {
    content: Buffer,           // Nội dung file dưới dạng Buffer
    filename: string,          // Tên file gốc để hiển thị trong email
  }
]
```

## Giới hạn và Lưu ý

### Upload Limits
- **Loại file cho phép**: JPEG, JPG, PNG, GIF, WebP (chỉ ảnh)
- **Kích thước tối đa mỗi file**: 5MB
- **Số lượng file tối đa**: 3 files per feedback

### Email Attachment Limits (Resend)
- **Tổng kích thước tất cả attachments**: Thường là 40MB cho một email
- Nếu upload files lớn, cần lưu ý giới hạn này

### Error Handling
- Nếu không tải được file từ Storage, email vẫn được gửi nhưng không có attachment đó
- Lỗi download attachment được log nhưng không fail toàn bộ request
- Email notification là non-blocking - nếu gửi email thất bại, feedback vẫn được lưu thành công

## Biến môi trường cần thiết

```bash
# Resend API Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=FastRezu <onboarding@resend.dev>
TEAM_EMAIL=team@example.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

## Testing Checklist

- [ ] Test upload ảnh feedback
- [ ] Test submit feedback có attachment
- [ ] Test submit feedback không có attachment
- [ ] Kiểm tra email nhận được với attachments
- [ ] Test với nhiều attachments (1, 2, 3 files)
- [ ] Test với file size gần giới hạn (4-5MB)
- [ ] Kiểm tra error handling khi không tải được file
- [ ] Verify rằng feedback vẫn được lưu nếu email fail

## Tham khảo

- [Resend Email Attachments Examples](https://github.com/resend/resend-examples/tree/main/with-attachments)
- [Resend Node.js SDK Documentation](https://resend.com/docs/send-with-nodejs)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)

## Changelog

**Date**: November 8, 2025

### Fixed
- Sửa lỗi hiển thị font của nút "Gửi phản hồi" khi click

### Added
- Tính năng đính kèm attachment vào email feedback notification
- Download files từ Supabase Storage
- Convert files sang Buffer format cho Resend API
- Logging chi tiết cho attachment processing

### Modified
- Cập nhật `sendFeedbackNotificationEmail()` để nhận `supabaseClient`
- Thêm `file_path` vào các query select của `feedback_attachments`
- Cải thiện error handling cho attachment processing
