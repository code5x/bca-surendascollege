// functions/api/feedback_sign_url.js
import { createAdmin } from '../_supabase.js'
import { countTodayUploads, sanitizeFilename } from '../_utils.js'
import { corsHeaders, handleOptions } from '../_cors.js'

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return handleOptions()
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders() })
  }

  try {
    const body = await request.json()
    const { feedback_id, filename, size } = body
    if (!feedback_id || !filename) {
      return new Response(JSON.stringify({ error: 'feedback_id and filename required' }), { status: 400, headers: corsHeaders() })
    }

    const MAX_SIZE = Number(env.MAX_FILE_SIZE_BYTES || 3145728)
    if (size && size > MAX_SIZE) {
      return new Response(JSON.stringify({ error: `file too large; max ${MAX_SIZE} bytes` }), { status: 413, headers: corsHeaders() })
    }

    const supabase = createAdmin(env)
    const dailyCap = Number(env.DAILY_CAP || 50)
    const used = await countTodayUploads(supabase, env.BUCKET_NAME)
    if (used + 1 > dailyCap) {
      return new Response(JSON.stringify({ error: `daily upload cap ${dailyCap} reached` }), { status: 429, headers: corsHeaders() })
    }

    const safeName = sanitizeFilename(filename)
    const filePath = `feedback_images/${safeName}`

    const { data, error } = await supabase.storage.from(env.BUCKET_NAME).createSignedUploadUrl(filePath, 3600)
    if (error) throw error

    return new Response(JSON.stringify({ uploadUrl: data.signedUrl, filePath }), {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json'
      }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: corsHeaders(),
    })
  }
}
