// functions/api/feedback_text.js
import { createAdmin } from '../_supabase.js'
import { todayStartISO } from '../_utils.js'

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json()
    const { name, email, types, message } = body
    if (!name || !message) return new Response(JSON.stringify({ error: 'name and message required' }), { status: 400 })

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
    if (error) throw error

    return new Response(JSON.stringify({ feedback_id: data.id }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 })
  }
}
