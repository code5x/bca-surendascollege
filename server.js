// server.js  (merged from server1.js + server2.js)
// - Uses Supabase service role (server-side only).
// - Multer is used for single-file feedback uploads (memory).
// - createSignedUploadUrl used for multi-file uploads (resources / notes).
//
// IMPORTANT:
// - Do NOT put BUCKET_NAME directly in code. It is read from process.env.BUCKET_NAME.
// - Keep SUPABASE_SERVICE_ROLE_KEY secret (server-side only).
// - When deploying to Cloudflare Pages Functions / Workers you'll need to adapt:
//     * remove express.static / app.listen (serverless environment)
//     * remove multer / accept uploads differently (Workers don't support multer)
//     * keep Supabase service role usage server-side only.
//
// ENV VARS required:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   BUCKET_NAME
//   (optional) PORT

require('dotenv').config();
const express = require('express');
const multer = require('multer'); // used for feedback single file upload (memory)
const { createClient } = require('@supabase/supabase-js');
const pathModule = require('path'); // renamed to avoid local variable name conflicts

const app = express();
app.use(express.json());

// ---------- ENV & Supabase client ----------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = process.env.BUCKET_NAME; // <-- never hard-code this, must be in env

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BUCKET_NAME) {
  console.error('Missing required env vars. Please set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and BUCKET_NAME.');
  process.exit(1);
}

// Server-side (admin) client using service role
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------- Multer (memory) for single-file uploads ----------
// Note: Multer is fine for local node / most server hosts.
// Cloudflare Workers / Pages Functions do NOT support multer; adapt upload method when deploying serverless.
const upload = multer({ storage: multer.memoryStorage() });

// ---------- Static serve (LOCAL TESTING) ----------
// For local testing it's convenient to serve static files from the repo root.
// When deploying to Cloudflare Pages Functions you should remove or disable this line (serverless).
// app.use(express.static(pathModule.join(__dirname)));

// ---------- CORS ----------
// Adjust origin for production. '*' is permissive and OK for local testing only.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // <--- change in production
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ---------- Utility ----------
function generateFolderName() {
  const now = new Date();
  const pad = (n) => (n < 10 ? '0' + n : n.toString());
  return (
    now.getFullYear().toString() +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    '_' +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

// ---------- ROUTES ----------

// 1) Save text feedback: POST /api/feedback/text
app.post('/api/feedback/text', async (req, res) => {
  try {
    const { name, email, types, message, created_at } = req.body;
    if (!name || !message) return res.status(400).json({ error: 'name and message required' });

    const payload = {
      name,
      email: email || null,
      types: types || [],
      message,
      images: [], // images will be attached later via /api/feedback/complete
      created_at: created_at || new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('feedbacks')
      .insert([payload])
      .select('id')
      .single();

    if (error) {
      console.error('Supabase insert error (feedback text):', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ feedback_id: data.id || data });
  } catch (err) {
    console.error('Error /api/feedback/text:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2) Upload one feedback file: POST /api/feedback/upload?feedback_id=...&filename=...
//    This route expects a multipart/form-data body with field "file".
//    Uses multer to parse into memory, then uploads to Supabase Storage.
app.post('/api/feedback/upload', upload.single('file'), async (req, res) => {
  try {
    const { feedback_id, filename } = req.query;
    if (!feedback_id) return res.status(400).json({ error: 'feedback_id required' });
    if (!req.file) return res.status(400).json({ error: 'file missing' });

    const fileBuffer = req.file.buffer;
    const contentType = req.file.mimetype;
    const filePath = `feedback_screenshots/${filename}`;

    // Upload to Supabase Storage (server-side)
    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, { contentType, upsert: false });

    if (error) {
      console.error('Supabase storage upload error (feedback):', error);
      return res.status(500).json({ error: error.message });
    }

    // Get public URL (note: if bucket is private, this URL may require signed access)
    const { data: urlData } = await supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = urlData && urlData.publicUrl ? urlData.publicUrl : null;

    return res.json({ publicPath: publicUrl || filePath });
  } catch (err) {
    console.error('Error /api/feedback/upload:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3) Finalize feedback row with image URLs: POST /api/feedback/complete
app.post('/api/feedback/complete', async (req, res) => {
  try {
    const { feedback_id, images } = req.body;
    if (!feedback_id) return res.status(400).json({ error: 'feedback_id required' });

    const { error } = await supabaseAdmin
      .from('feedbacks')
      .update({ images: images || [] })
      .eq('id', feedback_id);

    if (error) {
      console.error('Supabase update error (feedback complete):', error);
      return res.status(500).json({ error: error.message });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error /api/feedback/complete:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4) create_resource_upload: accepts metadata, inserts DB row and returns signed upload URLs
//    POST /api/create_resource_upload
app.post('/api/create_resource_upload', async (req, res) => {
  try {
    const { name, about_file, date, filenames } = req.body;
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({ ok: false, message: 'filenames array required' });
    }

    const folderName = generateFolderName();
    const basePath = `upload_resources/${folderName}/`;

    // Insert metadata row
    const { data, error } = await supabaseAdmin
      .from('study_materials')
      .insert({
        name,
        about_file,
        date,
        file_link: filenames.map((f) => basePath + f),
      })
      .select();

    if (error) throw error;

    // Create signed upload URLs for each file (server-side)
    const uploadUrls = await Promise.all(
      filenames.map(async (fname) => {
        const fullPath = basePath + fname;
        // NOTE: createSignedUploadUrl is server-side only and returns temporary URL that client can PUT to.
        const { data, error } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .createSignedUploadUrl(fullPath);
        if (error) throw error;
        return { fileName: fname, url: data.signedUrl };
      })
    );

    res.json({ ok: true, uploadUrls });
  } catch (err) {
    console.error('Error /api/create_resource_upload:', err);
    res.status(500).json({ ok: false, message: err.message || String(err) });
  }
});

// 5) create_notes_upload: same as resources but for class_notes table
//    POST /api/create_notes_upload
app.post('/api/create_notes_upload', async (req, res) => {
  try {
    const { name, about_notes, date, filenames } = req.body;
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({ ok: false, message: 'filenames array required' });
    }

    const folderName = generateFolderName();
    const basePath = `upload_notes/${folderName}/`;

    const { data, error } = await supabaseAdmin
      .from('class_notes')
      .insert({
        name,
        about_notes,
        date,
        file_link: filenames.map((f) => basePath + f),
      })
      .select();

    if (error) throw error;

    const uploadUrls = await Promise.all(
      filenames.map(async (fname) => {
        const fullPath = basePath + fname;
        const { data, error } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .createSignedUploadUrl(fullPath);
        if (error) throw error;
        return { fileName: fname, url: data.signedUrl };
      })
    );

    res.json({ ok: true, uploadUrls });
  } catch (err) {
    console.error('Error /api/create_notes_upload:', err);
    res.status(500).json({ ok: false, message: err.message || String(err) });
  }
});

// ---------- Start server (LOCAL) ----------
// In local development you can run this file with `node server.js`.
// For Cloudflare Pages Functions / Workers you will NOT call app.listen; you will export handlers instead.
/* const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Using Supabase URL: ${SUPABASE_URL}`);
  console.log(`Using bucket (from env): ${BUCKET_NAME} (not hard-coded)`);
}); */

// ---------- End of file ----------
