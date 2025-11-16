import { parseBookDetails } from "../_indcatutils.js";

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url).searchParams.get("url");
    if (!url)
      return new Response(
        JSON.stringify({ success: false, error: "Missing URL" })
      );

    const res = await fetch(url);
    const html = await res.text();

    const book = parseBookDetails(html);

    return new Response(JSON.stringify({ success: true, book }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }));
  }
}
