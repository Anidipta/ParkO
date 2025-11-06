import { createClient } from '@supabase/supabase-js'

// Client-side Supabase instance. Must use NEXT_PUBLIC_* env vars so they're available in the browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // It's okay in dev if env isn't set; we still export the client but some calls will fail until keys are provided.
  console.warn('Supabase client not fully configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env')
}

export const supabase = createClient(url as string, anonKey as string)

export default supabase
