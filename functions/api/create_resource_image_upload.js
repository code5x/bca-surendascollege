// functions/api/create_notes_upload.js
import { createAdmin } from '../_supabase.js'
import { timestampFolder, sanitizeFilename } from '../_utils.js'

export async function onRequestPost({ request, env }) {
  try {
    const { name, about_notes, date, filenames, sizes } = await request.json()
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return new Response(JSON.stringify({ ok: false, message: 'filenames array required' }), { status: 400 })
    }

    const supabase = createAdmin(env)

const MAX_IMAGES = 50
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

if (filenames.length > MAX_IMAGES) {
  return new Response(JSON.stringify({
    ok: false,
    message: `You can upload max ${MAX_IMAGES} images at a time`
  }), { status: 400 })
}

if (Array.isArray(sizes)) {
  for (const s of sizes) {
    if (s && s > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({
        ok: false,
        message: `One file exceeds max size ${MAX_FILE_SIZE}`
      }), { status: 413 })
    }
  }
}


    const folder = `upload_resources_image/${timestampFolder()}/`
    const file_links = filenames.map(f => folder + sanitizeFilename(f))
    const { data: insertData, error: insertError } = await supabase.from('study_materials_image').insert({
      name, about_notes, date, file_link: file_links, created_at: new Date().toISOString()
    }).select().single()
    if (insertError) throw insertError

    const uploadUrls = []
    for (const f of filenames) {
      const safe = sanitizeFilename(f)
      const path = folder + safe
      const { data, error } = await supabase.storage.from(env.BUCKET_NAME).createSignedUploadUrl(path, 3600)
      if (error) throw error
      uploadUrls.push({ fileName: f, url: data.signedUrl, path })
    }

    return new Response(JSON.stringify({ ok: true, uploadUrls }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, message: err.message || String(err) }), { status: 500 })
  }
}
