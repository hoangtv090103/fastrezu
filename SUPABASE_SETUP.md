# Supabase Setup cho FastRezu

## 1. Tạo Project Supabase

1. Truy cập [supabase.com](https://supabase.com)
2. Đăng nhập và tạo project mới
3. Chọn region gần nhất (Singapore cho Việt Nam)
4. Đặt password cho database

## 2. Lấy thông tin kết nối

1. Vào **Settings** > **API**
2. Copy các thông tin sau:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

## 3. Cấu hình Environment Variables

Cập nhật file `.env.local` với thông tin thực:

```env
# Site URL - quan trọng cho magic link authentication
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Lưu ý quan trọng**: 
- `NEXT_PUBLIC_SITE_URL` phải được set đúng domain production để magic link hoạt động
- Trong development, có thể bỏ qua biến này (sẽ dùng localhost)
- Trong production, phải set đúng domain (ví dụ: https://fastrezu.com)

## 4. Cấu hình Authentication trong Supabase

1. Vào **Authentication** > **URL Configuration** trong Supabase Dashboard
2. Thêm các URL sau vào **Redirect URLs**:
   - `https://yourdomain.com/auth/callback` (production)
   - `http://localhost:3000/auth/callback` (development)
3. Thêm các URL sau vào **Site URL**:
   - `https://yourdomain.com` (production)
   - `http://localhost:3000` (development)

## 5. Tạo bảng trong Supabase

1. Vào **SQL Editor** trong Supabase Dashboard
2. Copy và chạy nội dung file `supabase-schema.sql`
3. Kiểm tra bảng `subscribers` đã được tạo

## 6. Test API

Sau khi setup xong, bạn có thể test API bằng cách:

```bash
curl -X POST http://localhost:3000/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 7. Kiểm tra dữ liệu

Vào **Table Editor** trong Supabase Dashboard để xem các email đã đăng ký.

## Cấu trúc bảng subscribers

- `id`: UUID primary key
- `email`: Email address (unique)
- `status`: Trạng thái (pending, confirmed, unsubscribed)
- `created_at`: Thời gian tạo
- `updated_at`: Thời gian cập nhật
- `source`: Nguồn đăng ký (landing_page)
- `metadata`: Dữ liệu bổ sung (JSON)
