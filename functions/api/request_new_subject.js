// functions/api/request_new_subject.js

import { createAdmin } from '../_supabase.js'
import { timestampFolder, sanitizeFilename } from '../_utils.js'
import { corsHeaders, handleOptions } from '../_cors.js'

export async function onRequest(context) {
  const { request, env } = context

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleOptions()
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, message: 'Method not allowed' }),
      { status: 405, headers: corsHeaders() }
    )
  }

  try {
    const body = await request.json()

    const {
      name,
      semester,
      course,
      paper,
      filenames,
      sizes
    } = body

    /* ---------------- Validation ---------------- */

    if (!name || !semester || !course || !paper) {
      return new Response(
        JSON.stringify({ ok: false, message: 'All fields are required' }),
        { status: 400, headers: corsHeaders() }
      )
    }

    if (!Array.isArray(filenames) || filenames.length < 3) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Minimum 3 files required' }),
        { status: 400, headers: corsHeaders() }
      )
    }

    if (filenames.length > 20) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Maximum 20 files allowed' }),
        { status: 400, headers: corsHeaders() }
      )
    }

    const MAX_EACH = 300 * 1024 * 1024
    const MAX_TOTAL = 500 * 1024 * 1024

    let totalSize = 0

    if (Array.isArray(sizes)) {
      for (const s of sizes) {
        if (s > MAX_EACH) {
          return new Response(
            JSON.stringify({ ok: false, message: 'One file exceeds 300 MB' }),
            { status: 413, headers: corsHeaders() }
          )
        }
        totalSize += s
      }
    }

    if (totalSize > MAX_TOTAL) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Total file size exceeds 500 MB' }),
        { status: 413, headers: corsHeaders() }
      )
    }

    /* ---------------- Supabase ---------------- */

    const supabase = createAdmin(env)

    /* ---------------- Folder Structure ---------------- */

    const timeFolder = timestampFolder()

    const baseFolder =
      `upload_courses/semester_${semester}/${course}/${timeFolder}/`

    const fileLinks = filenames.map(f =>
      baseFolder + sanitizeFilename(f)
    )

    /* ---------------- Insert Database Row ---------------- */

    const { data: row, error: insertError } =
      await supabase
        .from('course_materials')
        .insert({
          name,
          semester,
          course,
          paper,
          file_link: fileLinks,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

    if (insertError) {
      throw insertError
    }

    /* ---------------- Create Signed Upload URLs ---------------- */

    const uploadUrls = []

    for (const filename of filenames) {
      const safeName = sanitizeFilename(filename)
      const path = baseFolder + safeName

      const { data, error } =
        await supabase
          .storage
          .from(env.BUCKET_NAME)
          .createSignedUploadUrl(path, 3600)

      if (error) {
        throw error
      }

      uploadUrls.push({
        fileName: filename,
        path,
        signedUrl: data.signedUrl
      })
    }

    /* ---------------- Success Response ---------------- */

    return new Response(
      JSON.stringify({
        ok: true,
        record_id: row.id,
        uploadUrls
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: err.message || 'Server error'
      }),
      {
        status: 500,
        headers: corsHeaders()
      }
    )
  }
}
