import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Custom storage adapter that works in incognito/private mode
// Falls back to memory storage when localStorage is unavailable
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

const storageAdapter = new BrowserStorageAdapter()

export const createClient = (): SupabaseClient => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use custom storage adapter for incognito mode support
        storage: storageAdapter,
        // Enable PKCE flow for better security
        flowType: 'pkce',
        // Always persist session (will use memory if needed)
        persistSession: true,
        // Auto refresh tokens
        autoRefreshToken: true,
        // Detect session in URL for OAuth callbacks
        detectSessionInUrl: true,
      },
      cookieOptions: {
        // Cookie options compatible with incognito mode
        name: 'sb-auth-token',
        path: '/',
        sameSite: 'lax',
        // Only use secure in production
        secure: process.env.NODE_ENV === 'production',
        // Max age 7 days
        maxAge: 60 * 60 * 24 * 7,
      },
    }
  )
}
