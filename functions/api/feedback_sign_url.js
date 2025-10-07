// functions/api/feedback_sign_url.js
import { createAdmin } from '../_supabase.js'
import { countTodayUploads, sanitizeFilename } from '../_utils.js'

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json()
    const { feedback_id, filename, size } = body
    if (!feedback_id || !filename) {
      return new Response(JSON.stringify({ error: 'feedback_id and filename required' }), { status: 400 })
    }

    const MAX_SIZE = Number(env.MAX_FILE_SIZE_BYTES || 3145728) // 3MB default
    if (size && size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: `file too large; max ${MAX_SIZE} bytes` }), { status: 413 })
    }

    const supabase = createAdmin(env)
    const dailyCap = Number(env.DAILY_CAP || 50)
    const used = await countTodayUploads(supabase, env.BUCKET_NAME)
    if (used + 1 > dailyCap) {
      return new Response(JSON.stringify({ error: `daily upload cap ${dailyCap} reached` }), { status: 429 })
    }

    const safeName = sanitizeFilename(filename)
    const filePath = `feedback_screenshots/${safeName}`

    const { data, error } = await supabase.storage.from(env.BUCKET_NAME).createSignedUploadUrl(filePath, 3600)
    if (error) throw error

    return new Response(JSON.stringify({ uploadUrl: data.signedUrl, filePath }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 })
  }
}
