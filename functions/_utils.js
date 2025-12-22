// functions/_utils.js
// small helpers used by multiple endpoints

export function todayStartISO() {
  const now = new Date()
  now.setUTCHours(0,0,0,0)
  return now.toISOString()
}

export function pad(n){ return n < 10 ? '0'+n : String(n) }

export function timestampFolder() {
  const d = new Date()
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

/**
 * Count number of files created today across tables that store file arrays.
 * We query the three tables and sum lengths of arrays in JS.
 */
export async function countTodayUploads(supabase, bucketName) {
  const since = todayStartISO()

  // feedbacks -> images (array)
  let total = 0
  const t1 = await supabase.from('feedbacks').select('images,created_at').gte('created_at', since)
  if (t1.error) throw t1.error
  if (t1.data) for (const r of t1.data) if (Array.isArray(r.images)) total += r.images.length

  // study_materials -> file_link (array)
  const t2 = await supabase.from('study_materials').select('file_link,created_at').gte('created_at', since)
  if (t2.error) throw t2.error
  if (t2.data) for (const r of t2.data) if (Array.isArray(r.file_link)) total += r.file_link.length

  // class_notes -> file_link (array)
  const t3 = await supabase.from('study_materials_image').select('file_link,created_at').gte('created_at', since)
  if (t3.error) throw t3.error
  if (t3.data) for (const r of t3.data) if (Array.isArray(r.file_link)) total += r.file_link.length

  return total
}

/**
 * Validate filename characters (very basic)
 */
export function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9-_\.]/g, '_')
}
