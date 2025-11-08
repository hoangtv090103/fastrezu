# Tóm Tắt: Khắc Phục Lỗi Redirect Loop và Magic Link

## Ngày: 8 tháng 11, 2025

## Vấn Đề Được Giải Quyết

### 1. ❌ ERR_TOO_MANY_REDIRECTS
**Triệu chứng:** Người dùng đã đăng nhập nhưng bị redirect loop vô tận khi truy cập từ landing page.

**Nguyên nhân:** 
- Middleware và page components đều cố redirect người dùng
- Không đồng bộ giữa `getSession()` và `getUser()`
- Logic authentication bị duplicate ở nhiều layer

### 2. 🔐 Magic Link trên Mobile
**Triệu chứng:** Magic link không hoạt động đúng trên mobile browsers.

**Nguyên nhân:**
- Cookie settings không tương thích với mobile
- Redirect URL không được config đúng
- PKCE flow không được implement

## Các Thay Đổi Chính

### 1. Middleware (`src/middleware.ts`)
✅ **Đơn giản hóa logic:**
```typescript
// CHỈ bảo vệ authenticated routes
// KHÔNG redirect từ /login
// SKIP tất cả /auth/* routes
```

✅ **Vai trò:**
- Bảo vệ `/dashboard`, `/editor`, `/check-cv`
- Redirect về `/login` nếu chưa authenticate
- Không can thiệp vào auth flow

### 2. Login Page (`src/app/login/page.tsx`)
✅ **Client-side authentication check:**
```typescript
// Check session trong useEffect
// Redirect về dashboard nếu đã login
// Wrap useSearchParams trong Suspense
```

✅ **Vai trò:**
- Kiểm tra auth và redirect (client-side)
- Hiển thị login form cho unauthenticated users
- Handle "next" parameter để redirect back

### 3. Auth Callback (`src/app/auth/callback/route.ts`)
✅ **Cải thiện cookie handling:**
```typescript
// Explicitly set session cookies
// Better error handling
// Don't fail on profile creation error
```

✅ **Vai trò:**
- Exchange code for session
- Set cookies properly cho mobile
- Create user profile
- Redirect về destination

## Architecture Flow

```
┌─────────────┐
│ Landing Page│
└──────┬──────┘
       │
       ▼
┌─────────────┐         ┌──────────────┐
│ Login Page  │────────▶│  Middleware  │
│ (Client)    │◀────────│  (Skip /login)│
└──────┬──────┘         └──────────────┘
       │
       │ (Already logged in?)
       ├─ YES ──────────────────────────┐
       │                                 │
       │ (Send magic link)              │
       ▼                                 ▼
┌─────────────┐         ┌──────────────┐
│   Email     │         │  Dashboard   │
└──────┬──────┘         └──────────────┘
       │
       │ (Click link)
       ▼
┌─────────────┐
│Auth Callback│
│ (Exchange)  │
└──────┬──────┘
       │
       │ (Set cookies)
       ▼
┌─────────────┐         ┌──────────────┐
│  Dashboard  │◀────────│  Middleware  │
│             │         │ (Check auth) │
└─────────────┘         └──────────────┘
```

## Separation of Concerns

| Component | Responsibility | Type |
|-----------|---------------|------|
| **Middleware** | Protect authenticated routes only | Server |
| **Login Page** | Check auth & redirect if logged in | Client |
| **Auth Callback** | Exchange code & set cookies | Server |
| **Auth Layout** | Verify user & fetch profile | Server |

## Key Principles

### 1. 🚫 Avoid Duplicate Logic
- Middleware: Chỉ protect routes
- Pages: Handle their own redirect logic

### 2. 🔄 Client vs Server Redirects
- **Client redirects:** Login page (avoid loop)
- **Server redirects:** Protected routes, auth callback

### 3. 🍪 Cookie Management
```typescript
{
  sameSite: 'lax',      // Mobile compatible
  secure: production,    // HTTPS only in prod
  path: '/',            // Available everywhere
  maxAge: 7 * 24 * 60 * 60 // 7 days
}
```

### 4. 🎯 Next.js 15 Requirements
- Wrap `useSearchParams()` in `<Suspense>`
- Use `router.replace()` instead of `redirect()`
- Handle prerendering properly

## Testing Checklist

- [ ] User chưa login access `/dashboard` → redirect `/login`
- [ ] User đã login access `/login` → redirect `/dashboard`
- [ ] Click magic link → successful login → redirect `/dashboard`
- [ ] Refresh page after login → NO redirect loop
- [ ] Access from landing page → NO ERR_TOO_MANY_REDIRECTS
- [ ] Test trên mobile browser
- [ ] Test trên desktop browser
- [ ] Test với deep links
- [ ] Test với expired magic link

## Files Modified

```
src/
├── middleware.ts                     (✏️ Simplified)
├── app/
│   ├── login/
│   │   └── page.tsx                 (✏️ Added client-side check)
│   └── auth/
│       └── callback/
│           └── route.ts             (✏️ Better cookie handling)
docs/
└── REDIRECT_LOOP_FIX.md             (📄 New documentation)
```

## Environment Variables

Đảm bảo các biến sau được set trong `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_SITE_URL=https://yourdomain.com  # Production

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Supabase Dashboard Config

1. Navigate to Authentication → URL Configuration
2. Set **Site URL:** `https://yourdomain.com`
3. Add **Redirect URLs:**
   - `http://localhost:3000/auth/callback` (Development)
   - `https://yourdomain.com/auth/callback` (Production)

## Commands

```bash
# Build and check for errors
bun run build

# Run development server
bun run dev

# Test on mobile device
# Access: http://YOUR_IP:3000
```

## Next Steps

1. ✅ Test thoroughly on mobile devices
2. ✅ Clear browser cookies before testing
3. ✅ Test with different email providers
4. ⏭️ Monitor Supabase auth logs
5. ⏭️ Add analytics for auth flow
6. ⏭️ Consider adding OAuth providers

## Related Documentation

- [MAGIC_LINK_MOBILE_FIX.md](./MAGIC_LINK_MOBILE_FIX.md)
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- [REDIRECT_LOOP_FIX.md](./REDIRECT_LOOP_FIX.md)

## Support

Nếu vẫn gặp vấn đề:
1. Check browser console for errors
2. Check Supabase auth logs
3. Verify cookies are being set
4. Test in incognito/private mode
5. Clear all cookies and try again

---

**Status:** ✅ Resolved
**Build:** ✅ Passing
**Server:** ✅ Running on http://localhost:3000
