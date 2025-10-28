# 🎯 Tính năng Feedback - FastRezu

Tính năng feedback cho phép người dùng gửi báo lỗi, góp ý, đề xuất tính năng và chia sẻ cảm nhận về sản phẩm.

## ✨ Tính năng

### 🔧 Database Schema
- **Bảng `feedback`**: Lưu trữ tất cả phản hồi từ người dùng
- **Bảng `feedback_attachments`**: Lưu trữ file attachments cho feedback
- **Storage bucket `feedback-attachments`**: Lưu trữ ảnh và screenshots

#### Bảng feedback - Các trường chính:
  - `feedback_type`: Loại phản hồi (bug_report, feature_request, general_feedback, praise)
  - `subject`: Tiêu đề phản hồi
  - `message`: Nội dung chi tiết
  - `priority`: Mức độ ưu tiên (low, medium, high, critical)
  - `status`: Trạng thái (open, in_progress, resolved, closed)
  - `metadata`: Thông tin bổ sung (browser info, URL, etc.)

#### Bảng feedback_attachments - Các trường chính:
  - `feedback_id`: ID của feedback liên quan
  - `file_name`: Tên file trong storage
  - `file_path`: Đường dẫn file trong storage
  - `file_size`: Kích thước file (bytes)
  - `file_type`: MIME type (image/jpeg, image/png, etc.)
  - `original_name`: Tên file gốc
  - `uploaded_by`: User upload (nullable cho anonymous)

### 🌐 API Endpoints
- **POST /api/feedback**: Gửi phản hồi mới (với attachments)
- **GET /api/feedback**: Lấy danh sách phản hồi của user (authenticated users only)
- **POST /api/feedback/upload**: Upload ảnh cho feedback

### 🎨 UI Components
- **FeedbackForm**: Form gửi phản hồi với validation và upload ảnh
- **FeedbackButton**: Floating button để mở feedback modal
- **FeedbackImageUpload**: Component upload ảnh với drag & drop
- **Feedback Page**: Trang feedback đầy đủ tại `/feedback`

## 🚀 Cách sử dụng

### 1. Chạy Migration
```sql
-- 1. Copy nội dung từ file feedback-migration.sql và chạy trong Supabase SQL Editor
-- 2. Copy nội dung từ file feedback-attachments-migration.sql và chạy
-- Hoặc chạy command:
psql -h [your-db-host] -d [your-db-name] -U [username] -f feedback-migration.sql
psql -h [your-db-host] -d [your-db-name] -U [username] -f feedback-attachments-migration.sql
```

### 2. Truy cập tính năng
- **Floating Button**: Xuất hiện ở góc dưới phải màn hình trên tất cả các trang
- **Menu**: Click vào avatar → "Gửi phản hồi" trong dropdown
- **Direct URL**: Truy cập `/feedback` để vào trang feedback

### 3. Các loại phản hồi
- 🐛 **Báo lỗi**: Báo cáo lỗi hoặc sự cố
- 💡 **Đề xuất tính năng**: Gợi ý tính năng mới
- 💬 **Phản hồi chung**: Chia sẻ cảm nhận và góp ý
- ⭐ **Lời khen**: Khen ngợi và đánh giá cao

## 🔒 Permissions & Security

### Row Level Security (RLS)
- **Authenticated users**: Có thể xem và cập nhật phản hồi của chính mình
- **Anonymous users**: Có thể gửi phản hồi (không cần đăng nhập)
- **Service role**: Full access để admin quản lý

### API Security
- POST endpoint: Cho phép anonymous users gửi feedback
- GET endpoint: Chỉ authenticated users mới xem được feedback của mình

## 📱 Responsive Design
- **Mobile**: Floating button và modal responsive
- **Tablet & Desktop**: Layout tối ưu cho mọi kích thước màn hình
- **Dark mode ready**: Sẵn sàng hỗ trợ dark mode

## 🎨 Styling
- Sử dụng Tailwind CSS v4
- Consistent với design system của FastRezu
- Smooth animations và transitions
- Custom icons cho từng loại feedback

## 🔄 Integration
- **Toast notifications**: Sử dụng react-hot-toast
- **Form validation**: Client-side validation với UX tốt
- **Auto-save**: Không có (feedback là one-time submission)
- **Real-time**: Không cần real-time updates

## 📸 Image Upload Features
- **Supported formats**: JPEG, PNG, GIF, WebP
- **File size limit**: 5MB per file
- **Maximum files**: 3 files per feedback
- **Drag & drop**: Direct drag and drop vào upload area
- **Preview**: Thumbnail preview của ảnh đã upload
- **Remove files**: Có thể xóa từng file riêng biệt
- **Anonymous support**: Anonymous users có thể upload ảnh
- **Secure storage**: Files stored in dedicated Supabase storage bucket

## 📊 Analytics & Monitoring
- **Metadata collection**: Browser info, current URL, user agent
- **Feedback categorization**: Dễ dàng filter theo loại và priority
- **Status tracking**: Theo dõi trạng thái xử lý feedback

## 🛠 Development Notes

### Dependencies
```json
{
  "react-hot-toast": "^2.6.0",
  "next/navigation": "15.5.6"
}
```

### File Structure
```
src/
├── app/
│   ├── api/feedback/
│   │   ├── route.ts
│   │   └── upload/
│   │       └── route.ts
│   ├── feedback/
│   │   └── page.tsx
│   └── (authenticated)/
│       └── layout.tsx
├── components/ui/
│   ├── FeedbackForm.tsx
│   ├── FeedbackButton.tsx
│   └── FeedbackImageUpload.tsx
└── types/
    └── database.ts (updated)
```

### Environment Variables
Không cần thêm environment variables mới.

## 🚨 Troubleshooting

### Common Issues
1. **Migration failed**: Kiểm tra Supabase connection và permissions
2. **API errors**: Check RLS policies và authentication
3. **Styling issues**: Ensure Tailwind CSS v4 is properly configured
4. **Toast not showing**: Check if Toaster is included in root layout

### Debug Steps
1. Kiểm tra browser console cho API errors
2. Verify database table creation
3. Test API endpoints directly
4. Check RLS policies in Supabase

## 🎯 Future Enhancements
- [ ] Admin dashboard để quản lý feedback
- [ ] Email notifications cho feedback mới
- [ ] Feedback analytics và reporting
- [ ] Integration với helpdesk systems (Jira, etc.)
- [ ] Advanced filtering và search
- [ ] Bulk actions cho admin

## 📝 Migration Checklist
- [x] Tạo bảng feedback trong database
- [x] Tạo bảng feedback_attachments trong database
- [x] Tạo storage bucket cho feedback attachments
- [x] Cập nhật database types
- [x] Tạo API endpoints (feedback + upload)
- [x] Tạo UI components (form, button, image upload)
- [x] Thêm floating button
- [x] Tạo trang feedback
- [x] Integration với header menu
- [x] Responsive design
- [x] Form validation
- [x] Toast notifications
- [x] RLS policies
- [x] Error handling
- [x] Drag & drop image upload
- [x] Image preview và management

## 🤝 Contributing
Khi thêm tính năng mới cho feedback system:
1. Cập nhật database schema nếu cần
2. Update TypeScript types
3. Thêm API endpoints với proper validation
4. Tạo UI components responsive
5. Test trên mobile và desktop
6. Update documentation
