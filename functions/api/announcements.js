import { createAdmin } from '../_supabase.js'

export async function onRequestGet(context) {
  try {
    const supabase = createAdmin(context.env)

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('announcements')
      .select('id,title,body,url,expiry')
      .eq('is_active', true)
      .gte('expiry', now)
      .order('created_at', { ascending: true })

    if (error) throw error

    return Response.json({
      success: true,
      announcements: data
    })

  } catch (err) {
    return Response.json({
      success: false,
      error: err.message
    }, {
      status: 500
    })
  }
}
