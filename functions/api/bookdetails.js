// functions/api/bookdetails.js
import { parseBookDetailsHtml } from "../_indcatutils.js";

export async function onRequestGet(context) {
  const url = context.request.url ? new URL(context.request.url).searchParams.get("url") : null;
  if (!url) {
    return new Response(JSON.stringify({ success: false, error: "Missing URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // fetch the book detail page
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();

    const book = parseBookDetailsHtml(html);

    if (!book.title) {
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch book details." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, book }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
