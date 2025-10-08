// functions/api/feedback_text.js
import { createAdmin } from '../_supabase.js'
import { corsHeaders, handleOptions } from '../_cors.js'

export async function onRequest(context) {
  const { request, env } = context

  // Handle OPTIONS preflight quickly
  if (request.method === 'OPTIONS') return handleOptions()

  // Only allow POST for the main logic
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders(),
    })
  }

  try {
    const body = await request.json()
    const { name, email, types, message } = body
    if (!name || !message) {
      return new Response(JSON.stringify({ error: 'name and message required' }), {
        status: 400,
        headers: corsHeaders(),
      })
    }

    const supabase = createAdmin(env)
    const payload = {
      name,
      email: email || null,
      types: types || [],
      message,
      images: [],
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabase.from('feedbacks').insert([payload]).select('id').single()
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders(),
      })
    }

    return new Response(JSON.stringify({ feedback_id: data.id }), {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json'
      },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 500,
      headers: corsHeaders(),
    })
  }
}
