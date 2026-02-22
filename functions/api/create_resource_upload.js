// functions/api/create_resource_upload.js
import { createAdmin } from '../_supabase.js'
import { timestampFolder, sanitizeFilename } from '../_utils.js'

export async function onRequestPost({ request, env }) {
  try {
    const { name, about_file, date, filenames, sizes } = await request.json()
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return new Response(JSON.stringify({ ok: false, message: 'filenames array required' }), { status: 400 })
    }

    const supabase = createAdmin(env)

const MAX_FILES = 20
const MAX_FILE_SIZE = 300 * 1024 * 1024      // 300MB
const MAX_TOTAL_SIZE = 500 * 1024 * 1024     // 500MB

if (filenames.length > MAX_FILES) {
  return new Response(JSON.stringify({
    ok: false,
    message: `You can upload max ${MAX_FILES} files at a time`
  }), { status: 400 })
}

if (Array.isArray(sizes)) {

  let total = 0

  for (const s of sizes) {
    if (s && s > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({
        ok: false,
        message: `One file exceeds max size ${MAX_FILE_SIZE}`
      }), { status: 413 })
    }
    if (s) total += s
  }

  if (total > MAX_TOTAL_SIZE) {
    return new Response(JSON.stringify({
      ok: false,
      message: `Total upload size exceeds ${MAX_TOTAL_SIZE}`
    }), { status: 413 })
  }
}

    const folder = `upload_resources/${timestampFolder()}/`
    // Insert metadata row
    const file_links = filenames.map(f => folder + sanitizeFilename(f))
    const { data: insertData, error: insertError } = await supabase.from('study_materials').insert({
      name, about_file, date, file_link: file_links, created_at: new Date().toISOString()
    }).select().single()
    if (insertError) throw insertError

    // Create signed URLs
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
