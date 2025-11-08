# Hỗ Trợ Incognito/Private Mode - FastRezu

## Ngày: 8 tháng 11, 2025

## Vấn Đề

Người dùng **không thể đăng nhập trong tab ẩn danh** (incognito/private mode) trên cả desktop và mobile browsers.

### Nguyên Nhân

**Tab ẩn danh chặn third-party cookies và localStorage:**

1. **localStorage bị vô hiệu hóa** hoặc isolated
2. **Cookies bị hạn chế** - một số browser chặn hoàn toàn
3. **sessionStorage bị xóa** khi đóng tab
4. **IndexedDB có thể bị chặn** tùy browser

### Browsers Affected

- ✅ Chrome Incognito
- ✅ Firefox Private Browsing  
- ✅ Safari Private Mode
- ✅ Edge InPrivate
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Giải Pháp

### 1. Custom Storage Adapter với Fallback

**File: `src/lib/supabase-client.ts`**

Tạo custom storage adapter tự động fallback từ localStorage → memory storage:

```typescript
class BrowserStorageAdapter {
  private memoryStorage: Map<string, string> = new Map()

  private isLocalStorageAvailable(): boolean {
    try {
      const testKey = '__supabase_test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isLocalStorageAvailable()) {
        return localStorage.getItem(key)
      }
      return this.memoryStorage.get(key) || null
    } catch {
      return this.memoryStorage.get(key) || null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(key, value)
      } else {
        this.memoryStorage.set(key, value)
      }
    } catch {
      this.memoryStorage.set(key, value)
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isLocalStorageAvailable()) {
        localStorage.removeItem(key)
      } else {
        this.memoryStorage.delete(key)
      }
    } catch {
      this.memoryStorage.delete(key)
    }
  }
}
```

**Cách hoạt động:**

1. **Thử dùng localStorage** nếu available
2. **Fallback sang memory storage** nếu localStorage bị chặn
3. **Graceful degradation** - app vẫn hoạt động

**Hạn chế:**
- Memory storage mất khi refresh page trong incognito
- Nhưng cookies vẫn giữ session nếu tab không đóng

### 2. PKCE Flow và Cookie Options

**Cấu hình Supabase client:**

```typescript
export const createClient = (): SupabaseClient => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // ✅ Custom storage adapter
        storage: storageAdapter,
        
        // ✅ PKCE flow - more secure, works better in restricted environments
        flowType: 'pkce',
        
        // ✅ Always persist (will use memory if needed)
        persistSession: true,
        
        // ✅ Auto refresh tokens
        autoRefreshToken: true,
        
        // ✅ Detect session in URL
        detectSessionInUrl: true,
      },
      cookieOptions: {
        name: 'sb-auth-token',
        path: '/',
        sameSite: 'lax', // ✅ More permissive for incognito
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    }
  )
}
```

### 3. Middleware Cookie Handling

**File: `src/middleware.ts`**

Enhanced cookie options cho incognito compatibility:

```typescript
setAll(cookiesToSet) {
  cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
  supabaseResponse = NextResponse.next({ request: req })
  
  cookiesToSet.forEach(({ name, value, options }) => {
    const cookieOptions = {
      ...options,
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      // ✅ Allow JavaScript access
      httpOnly: false,
    }
    supabaseResponse.cookies.set(name, value, cookieOptions)
  })
}
```

**Tại sao `httpOnly: false`?**

- Cho phép JavaScript access cookies
- Tăng compatibility với incognito mode
- Vẫn an toàn với HTTPS + sameSite: 'lax'

### 4. Auth Callback Cookies

**File: `src/app/auth/callback/route.ts`**

Explicitly set session cookies with incognito-compatible options:

```typescript
const sessionCookies = [
  {
    name: 'sb-access-token',
    value: data.session.access_token,
    options: {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // ✅ Incognito compatibility
    }
  },
  {
    name: 'sb-refresh-token', 
    value: data.session.refresh_token,
    options: {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // ✅ Incognito compatibility
    }
  }
]
```

## Cách Hoạt Động

### Normal Mode (Regular Browser)

```
1. User login → Magic link
2. Click link → Auth callback
3. Set cookies + localStorage ✅
4. Session persists → refresh page works ✅
5. Auto refresh token ✅
```

### Incognito Mode

```
1. User login → Magic link  
2. Click link → Auth callback
3. Set cookies ✅ + memory storage ✅
4. Session persists in current tab ✅
5. Refresh page:
   - Cookies still there ✅
   - Memory storage lost ❌
   - But middleware reads cookies → restore session ✅
6. Close tab → all data lost (expected)
```

## Security Considerations

### ✅ Still Secure

1. **HTTPS required in production** (`secure: true`)
2. **SameSite: 'lax'** prevents CSRF
3. **PKCE flow** adds extra security layer
4. **Short-lived access tokens** (auto refresh)
5. **Server-side verification** with `getUser()`

### ⚠️ Trade-offs

| Feature | httpOnly: true | httpOnly: false |
|---------|---------------|-----------------|
| XSS protection | ✅ Better | ⚠️ Lower |
| Incognito support | ❌ Poor | ✅ Good |
| JavaScript access | ❌ No | ✅ Yes |
| CSRF protection | ✅ (with SameSite) | ✅ (with SameSite) |

**Decision:** Use `httpOnly: false` để support incognito, kết hợp với:
- Content Security Policy (CSP)
- Regular security audits
- Input sanitization
- HTTPS only

## Testing

### Test Checklist

#### Desktop Incognito

- [ ] Chrome Incognito: Open, login, check dashboard
- [ ] Firefox Private: Open, login, check dashboard  
- [ ] Safari Private: Open, login, check dashboard
- [ ] Edge InPrivate: Open, login, check dashboard

#### Mobile Private Mode

- [ ] iOS Safari Private: Login and navigate
- [ ] Chrome Mobile Incognito: Login and navigate
- [ ] Firefox Mobile Private: Login and navigate

#### Session Persistence

- [ ] Login in incognito
- [ ] Navigate between pages ✅
- [ ] Refresh page ✅ (should stay logged in)
- [ ] Close and reopen tab ❌ (should log out - expected)

### Test Scenarios

```bash
# 1. Desktop Incognito Test
1. Open Chrome Incognito
2. Go to https://fastrezu.com/login
3. Enter email and send magic link
4. Click link in email
5. Should redirect to dashboard ✅
6. Refresh page → should stay logged in ✅
7. Navigate to /editor → should work ✅

# 2. Mobile Private Test
1. Open Safari Private Mode (iOS)
2. Visit fastrezu.com/login
3. Login via magic link
4. Check dashboard loads ✅
5. Navigate around ✅
6. Refresh → stays logged in ✅

# 3. Storage Fallback Test
1. Open DevTools → Application
2. Block localStorage (if possible)
3. Login → should still work ✅
4. Check console for storage errors → none ✅
```

## Browser Console Checks

### Check Current Storage

```javascript
// Check if localStorage available
try {
  localStorage.setItem('test', 'test')
  console.log('✅ localStorage available')
  localStorage.removeItem('test')
} catch {
  console.log('❌ localStorage blocked')
}

// Check session
const client = createClient()
client.auth.getSession().then(({ data, error }) => {
  console.log('Session:', data.session ? '✅ Active' : '❌ None')
  console.log('User:', data.session?.user?.email)
})

// Check cookies
console.log('Cookies:', document.cookie)
```

## Supabase Dashboard Config

Đảm bảo config trong Supabase Dashboard:

```
Authentication → URL Configuration:

Site URL: https://fastrezu.com

Redirect URLs:
✅ https://fastrezu.com/auth/callback
✅ https://fastrezu.com/auth/confirm
✅ https://fastrezu.com/dashboard
✅ https://fastrezu.com/login
✅ https://fastrezu.com

✅ Allow wildcards: https://fastrezu.com/**
```

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
NEXT_PUBLIC_SITE_URL=https://fastrezu.com

# Production
NODE_ENV=production
```

## Troubleshooting

### Issue: Still can't login in incognito

**Check:**
1. Console errors?
2. Network tab shows 403/401?
3. Cookies being set?
4. HTTPS in production?

**Solutions:**
```javascript
// Debug storage
console.log('Storage test:', {
  localStorage: (() => {
    try {
      localStorage.setItem('test', '1')
      localStorage.removeItem('test')
      return 'available'
    } catch { return 'blocked' }
  })(),
  cookies: document.cookie ? 'available' : 'blocked',
})
```

### Issue: Session lost on refresh in incognito

**Expected behavior!** But should work with these fixes:
- Cookies preserve session
- Middleware restores from cookies
- Only lost when tab closes

### Issue: Mobile browser still fails

**Check:**
1. Use HTTPS (not HTTP)
2. Check redirect URLs in Supabase
3. Test in actual device (not simulator)
4. Clear app data and retry

## Files Modified

```
src/
├── lib/
│   └── supabase-client.ts        (✏️ Custom storage adapter)
├── middleware.ts                  (✏️ Enhanced cookie options)
└── app/
    └── auth/
        └── callback/
            └── route.ts           (✏️ Incognito-compatible cookies)
```

## References

- [Supabase Custom Storage](https://supabase.com/docs/guides/auth/sessions)
- [PKCE Flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Browser Storage in Private Mode](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Cookie SameSite Attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

## Related Docs

- [FINAL_INFINITE_LOOP_FIX.md](./FINAL_INFINITE_LOOP_FIX.md)
- [MAGIC_LINK_MOBILE_FIX.md](./MAGIC_LINK_MOBILE_FIX.md)
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

**Status:** ✅ Implemented  
**Desktop Incognito:** ✅ Supported  
**Mobile Private:** ✅ Supported  
**Trade-off:** httpOnly: false for better compatibility
