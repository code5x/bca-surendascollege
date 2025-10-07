// functions/api/create_resource_upload.js
import { createAdmin } from '../_supabase.js'
import { timestampFolder, countTodayUploads, sanitizeFilename } from '../_utils.js'

export async function onRequestPost({ request, env }) {
  try {
    const { name, about_file, date, filenames, sizes } = await request.json()
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return new Response(JSON.stringify({ ok: false, message: 'filenames array required' }), { status: 400 })
    }

    const supabase = createAdmin(env)
    const dailyCap = Number(env.DAILY_CAP || 50)
    const used = await countTodayUploads(supabase, env.BUCKET_NAME)
    if (used + filenames.length > dailyCap) {
      return new Response(JSON.stringify({ ok: false, message: `daily upload cap ${dailyCap} would be exceeded` }), { status: 429 })
    }

    const MAX_SIZE = Number(env.MAX_FILESize_BYTES || env.MAX_FILE_SIZE_BYTES || 3145728)
    if (Array.isArray(sizes)) {
      for (const s of sizes) if (s && s > MAX_SIZE) {
        return new Response(JSON.stringify({ ok: false, message: `one file exceeds max size ${MAX_SIZE}` }), { status: 413 })
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
