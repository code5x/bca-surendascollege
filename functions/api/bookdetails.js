import { parseBookDetails } from "../_indcatutils.js";

export async function onRequest(context) {
  const url = new URL(context.request.url).searchParams.get("url");
  if (!url) {
    return Response.json({ success: false, error: "Missing URL" }, { status: 400 });
  }

  try {
      const pageRes = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const html = await pageRes.text();

      const book = parseBookDetails(html);

      if (!book.title) {
        return Response.json({ success: false, error: "Failed to fetch book details" });
      }

      return Response.json({ success: true, book });

  } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
