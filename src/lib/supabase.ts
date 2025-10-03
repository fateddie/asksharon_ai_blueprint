import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createClient() {
  // Create a supabase client on the browser with RLS enabled
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing - using fallback client')
    // Return a mock client that doesn't break the app
    return {
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        update: () => ({ data: null, error: { message: 'Supabase not configured' } }),
        delete: () => ({ data: null, error: { message: 'Supabase not configured' } })
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signIn: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        signOut: () => Promise.resolve({ error: null })
      }
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}