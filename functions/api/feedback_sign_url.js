// functions/api/feedback_sign_url.js
import { createAdmin } from '../_supabase.js'
import { sanitizeFilename } from '../_utils.js'
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

const MAX_FILE_SIZE = 4 * 1024 * 1024 // 4MB

if (size && size > MAX_FILE_SIZE) {
  return new Response(JSON.stringify({
    error: `file too large; max ${MAX_FILE_SIZE} bytes`
  }), { status: 413, headers: corsHeaders() })
}


    const supabase = createAdmin(env)

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
