# Khắc Phục Lỗi Redirect Loop (ERR_TOO_MANY_REDIRECTS)

## Ngày: 8 tháng 11, 2025

## Vấn Đề

Người dùng đã đăng nhập nhưng gặp lỗi **ERR_TOO_MANY_REDIRECTS** khi truy cập vào ứng dụng từ landing page. Lỗi này xảy ra do redirect loop giữa middleware và page components.

## Nguyên Nhân

1. **Middleware** kiểm tra session và redirect từ `/login` → `/dashboard` khi có session
2. **Page component** (`/login/page.tsx`) cũng kiểm tra session và redirect
3. **Authenticated Layout** cũng kiểm tra user và redirect về `/login`
4. Sự không đồng bộ giữa `getSession()` (middleware) và `getUser()` (layout) gây ra vòng lặp redirect

## Giải Pháp Đã Áp Dụng

### 1. Cập Nhật Middleware (`src/middleware.ts`)

**Thay đổi:**
- Loại bỏ logic redirect từ `/login` → `/dashboard` trong middleware
- Chỉ bảo vệ authenticated routes (dashboard, editor, check-cv)
- Skip middleware cho tất cả routes trong `/auth/*` để tránh xung đột với auth callback

```typescript
// Skip middleware for auth callback and error routes to prevent loops
const isAuthRoute = req.nextUrl.pathname.startsWith('/auth/')
if (isAuthRoute) {
  return res
}

// Check for authenticated routes (routes inside (authenticated) folder)
const isProtectedRoute = 
  req.nextUrl.pathname.startsWith('/dashboard') || 
  req.nextUrl.pathname.startsWith('/editor') ||
  req.nextUrl.pathname.startsWith('/check-cv')

if (isProtectedRoute && !session) {
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('next', req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

// Don't redirect from login page in middleware - let the page handle it client-side
```

### 2. Cập Nhật Login Page (`src/app/login/page.tsx`)

**Thay đổi:**
- Thêm client-side authentication check với `useEffect`
- Wrap `useSearchParams()` trong Suspense boundary để tránh lỗi prerender
- Redirect người dùng đã đăng nhập về dashboard từ client-side

```typescript
function LoginContent() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const next = searchParams.get('next') || '/dashboard';
          router.replace(next);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [supabase, router, searchParams]);
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginContent />
    </Suspense>
  );
}
```

### 3. Cải Thiện Auth Callback (`src/app/auth/callback/route.ts`)

**Thay đổi:**
- Kiểm tra code trước khi exchange
- Explicitly set session cookies trong response
- Cải thiện error handling và logging
- Không fail authentication nếu profile creation fails

```typescript
// Exchange code for session
const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

if (exchangeError || !data.session) {
  return NextResponse.redirect(new URL('/auth/error?message=Authentication failed', request.url))
}

// Create response with redirect
const redirectUrl = new URL(next, request.url)
const response = NextResponse.redirect(redirectUrl)

// Explicitly set the session cookies in the response
const sessionCookies = [
  {
    name: 'sb-access-token',
    value: data.session.access_token,
    options: {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
    }
  },
  // ... refresh token
]

sessionCookies.forEach(({ name, value, options }) => {
  response.cookies.set(name, value, options)
})
```

## Luồng Authentication Mới

1. **Landing Page → Login:**
   - User nhấn "Đăng nhập"
   - Chuyển đến `/login`

2. **Login Page:**
   - Client-side check: Nếu đã có session → redirect đến dashboard
   - Nếu chưa có session → hiển thị form đăng nhập
   - User nhập email → gửi magic link

3. **Email Magic Link:**
   - User nhấn vào link trong email
   - Redirect đến `/auth/callback?code=...`

4. **Auth Callback:**
   - Exchange code for session
   - Set cookies explicitly
   - Create user profile if needed
   - Redirect đến dashboard (hoặc `next` parameter)

5. **Middleware:**
   - Skip `/auth/*` routes
   - Check session chỉ cho protected routes
   - Không redirect từ `/login`

6. **Dashboard/Protected Routes:**
   - Layout check user
   - Nếu không có user → redirect về `/login`
   - Nếu có user → render content

## Các Điểm Cần Lưu Ý

### 1. Separation of Concerns
- **Middleware:** Chỉ bảo vệ authenticated routes
- **Login Page:** Xử lý redirect cho authenticated users
- **Auth Callback:** Xử lý code exchange và set cookies

### 2. Client-side vs Server-side Redirects
- **Client-side redirect** trong login page tránh được vấn đề redirect loop
- **Server-side redirect** vẫn được dùng cho protected routes và auth callback

### 3. Suspense Boundary
- Bắt buộc phải wrap `useSearchParams()` trong `<Suspense>` boundary
- Tránh lỗi prerender trong Next.js 15

### 4. Cookie Handling
- Explicitly set cookies trong auth callback response
- Sử dụng `sameSite: 'lax'` để tương thích với mobile
- Set `path: '/'` để cookies accessible trên toàn app

## Testing

### Test Cases
1. ✅ User chưa đăng nhập truy cập `/dashboard` → redirect về `/login`
2. ✅ User đã đăng nhập truy cập `/login` → redirect về `/dashboard`
3. ✅ User nhấn magic link → callback thành công → vào dashboard
4. ✅ User đã đăng nhập refresh page → không bị redirect loop
5. ✅ User access từ landing page → không bị ERR_TOO_MANY_REDIRECTS

### Cách Test
```bash
# 1. Clear cookies và local storage
# 2. Truy cập landing page
# 3. Nhấn "Đăng nhập"
# 4. Nhập email và gửi magic link
# 5. Click vào magic link trong email
# 6. Kiểm tra có redirect về dashboard không
# 7. Refresh page và kiểm tra không bị redirect loop
```

## Files Changed

1. `/src/middleware.ts` - Loại bỏ redirect từ login, skip auth routes
2. `/src/app/login/page.tsx` - Thêm client-side auth check, wrap Suspense
3. `/src/app/auth/callback/route.ts` - Cải thiện cookie setting và error handling

## Liên Quan

- [MAGIC_LINK_MOBILE_FIX.md](./MAGIC_LINK_MOBILE_FIX.md) - Fix magic link trên mobile
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Cấu hình Supabase

## References

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Supabase Auth with SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
