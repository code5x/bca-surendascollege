import { parseBookDetails } from "../_indcatutils.js";

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url).searchParams.get("url");
    if (!url)
      return Response.json({ success: false, error: "URL missing" });

    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await r.text();
    const book = parseBookDetails(html);

    if (!book.title)
      return Response.json({ success: false, error: "Failed to parse details" });

    return Response.json({ success: true, book });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
