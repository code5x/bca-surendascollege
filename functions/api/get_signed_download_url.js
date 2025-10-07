// functions/api/get_signed_download_url.js
import { createAdmin } from '../_supabase.js'

export async function onRequestPost({ request, env }) {
  try {
    const { path, expiry_seconds } = await request.json()
    if (!path) return new Response(JSON.stringify({ error: 'path required' }), { status: 400 })
    const supabase = createAdmin(env)
    const seconds = Number(expiry_seconds || 3600)
    const { data, error } = await supabase.storage.from(env.BUCKET_NAME).createSignedUrl(path, seconds)
    if (error) throw error
    return new Response(JSON.stringify({ signedUrl: data.signedUrl }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 })
  }
}
