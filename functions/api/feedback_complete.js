// functions/api/feedback_complete.js
import { createAdmin } from '../_supabase.js'
import { corsHeaders, handleOptions } from '../_cors.js'

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return handleOptions()
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders() })
  }

  try {
    const { feedback_id, images } = await request.json()
    if (!feedback_id) return new Response(JSON.stringify({ error: 'feedback_id required' }), { status: 400, headers: corsHeaders() })

    const supabase = createAdmin(env)
    const { error } = await supabase.from('feedbacks').update({ images: images || [] }).eq('id', feedback_id)
    if (error) throw error

    return new Response(JSON.stringify({ ok: true }), {
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
