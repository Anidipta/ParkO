import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client. Uses the SERVICE ROLE key from environment variables.
// Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in your server env (they already exist in `.env`).
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
    // keep auth disabled for server-side service client
    auth: { persistSession: false }
  }
)

export default supabaseAdmin
