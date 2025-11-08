# Sửa Lỗi Magic Link Trên Mobile

## Tóm tắt vấn đề

Magic link bị lỗi trên mobile do không xử lý đúng cách PKCE flow và cookie settings cho mobile browsers.

## Các thay đổi đã thực hiện

### 1. Cập nhật Login Page (`src/app/login/page.tsx`)

**Thay đổi:**
- Thêm phát hiện mobile device
- Cải thiện thông báo cho người dùng mobile
- Thêm `shouldCreateUser: true` option

**Lý do:**
- Người dùng mobile cần hướng dẫn rõ ràng hơn
- `shouldCreateUser` đảm bảo người dùng mới được tạo tự động

### 2. Cải thiện Auth Callback (`src/app/auth/callback/route.ts`)

**Thay đổi:**
- Cấu hình cookie với `sameSite: 'lax'` và `secure` cho production
- Thêm hỗ trợ `next` parameter để redirect linh hoạt

**Lý do:**
- Mobile browsers yêu cầu cấu hình cookie chặt chẽ hơn
- `sameSite: 'lax'` cho phép cookies hoạt động với redirects
- `secure: true` trong production đảm bảo bảo mật HTTPS

### 3. Tạo Auth Confirm Route (`src/app/auth/confirm/route.ts`) - MỚI

**Công dụng:**
- Xử lý PKCE flow (Proof Key for Code Exchange)
- Verify OTP token từ email magic link
- Tạo user profile tự động

**Lý do:**
- PKCE flow là phương thức khuyến nghị cho mobile authentication
- An toàn hơn cho mobile devices
- Tương thích tốt hơn với các email client trên mobile

### 4. Cập nhật Middleware (`src/middleware.ts`)

**Thay đổi:**
- Cookie options tương thích mobile: `sameSite: 'lax'`, `path: '/'`
- Cấu hình `secure` dựa trên environment

**Lý do:**
- Đảm bảo cookies persist đúng cách trên mobile browsers
- Tránh lỗi session không được lưu

## Cấu hình Supabase Dashboard

### Bước 1: Cấu hình Redirect URLs

1. Truy cập Supabase Dashboard
2. Vào **Authentication** → **URL Configuration**
3. Thêm các URLs sau vào **Redirect URLs**:

**Development:**
```
http://localhost:3002/auth/callback
http://localhost:3002/auth/confirm
```

**Production (thay yourdomain.com bằng domain thực tế):**
```
https://yourdomain.com/auth/callback
https://yourdomain.com/auth/confirm
```

### Bước 2: Cấu hình Site URL

Đảm bảo **Site URL** được set đúng:

**Development:**
```
http://localhost:3002
```

**Production:**
```
https://yourdomain.com
```

### Bước 3: Cấu hình Email Templates (Tùy chọn nhưng khuyến nghị)

1. Vào **Authentication** → **Email Templates**
2. Chọn **Magic Link** template
3. Cập nhật template để sử dụng PKCE flow:

```html
<h2>Đăng nhập vào FastRezu</h2>

<p>Nhấp vào link bên dưới để đăng nhập:</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Đăng nhập</a></p>

<p>Hoặc sao chép và dán URL này vào trình duyệt của bạn:</p>
<p>{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email</p>

<p><strong>Lưu ý:</strong> Link này chỉ có hiệu lực trong 1 giờ.</p>
```

### Bước 4: Kiểm tra SMTP Settings

Đảm bảo email configuration hoạt động:
1. Vào **Project Settings** → **Auth** → **SMTP Settings**
2. Verify SMTP đã được cấu hình đúng (hoặc sử dụng Supabase built-in email)

## Testing trên Mobile

### Test trên thiết bị thực

1. **Deploy lên staging/production** (localhost không test được trên mobile)
2. **Gửi magic link** từ mobile browser
3. **Mở email** trên mobile device
4. **Nhấp vào link** trong email
5. **Verify** redirect về app và login thành công

### Checklist Testing

- [ ] Magic link gửi thành công
- [ ] Email nhận được trong vòng 1 phút
- [ ] Link trong email có format đúng (`/auth/confirm?token_hash=...&type=email`)
- [ ] Nhấp link redirect về app
- [ ] Session được tạo thành công (check cookie)
- [ ] User được redirect về `/dashboard`
- [ ] User profile được tạo tự động

## Troubleshooting

### Lỗi: "Invalid or expired magic link"

**Nguyên nhân:**
- Link đã hết hạn (>1 giờ)
- Token hash không hợp lệ
- URL Configuration sai trong Supabase

**Giải pháp:**
1. Kiểm tra Redirect URLs trong Supabase
2. Request magic link mới
3. Đảm bảo NEXT_PUBLIC_SITE_URL match với Site URL trong Supabase

### Lỗi: Session không persist trên mobile

**Nguyên nhân:**
- Cookie settings không đúng
- Browser blocking third-party cookies

**Giải pháp:**
1. Verify cookie settings trong middleware và callback
2. Đảm bảo `sameSite: 'lax'` được set
3. Sử dụng HTTPS trong production (required cho `secure: true`)

### Lỗi: Redirect về login sau khi click magic link

**Nguyên nhân:**
- Session không được tạo đúng
- Middleware redirect quá sớm

**Giải pháp:**
1. Check console logs trong browser
2. Verify `/auth/confirm` route hoạt động
3. Test với network tab open để xem cookie flow

## Best Practices

### 1. Security

- ✅ Luôn sử dụng HTTPS trong production
- ✅ Set `secure: true` cho cookies trong production
- ✅ Sử dụng PKCE flow cho mobile
- ✅ Validate redirect URLs trong Supabase

### 2. User Experience

- ✅ Hiển thị message khác biệt cho mobile/desktop
- ✅ Thêm loading states rõ ràng
- ✅ Error messages dễ hiểu
- ✅ Auto-create user profiles

### 3. Monitoring

- ✅ Log errors chi tiết
- ✅ Track authentication failures
- ✅ Monitor email delivery rates

## Environment Variables Required

```env
# Production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NODE_ENV=production

# Development
NEXT_PUBLIC_SITE_URL=http://localhost:3002
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NODE_ENV=development
```

## Tài liệu tham khảo

- [Supabase Auth with PKCE](https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr)
- [Mobile Deep Linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking)
- [Next.js Supabase SSR](https://supabase.com/docs/guides/auth/server-side-rendering)
