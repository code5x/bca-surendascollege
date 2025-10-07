// functions/_supabase.js
import { createClient } from '@supabase/supabase-js'

export function createAdmin(env) {
  const url = env.SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || !env.BUCKET_NAME) {
    throw new Error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or BUCKET_NAME in env.')
  }
  // use global fetch so it works in Pages Functions
  return createClient(url, key, { global: { fetch } })
}
