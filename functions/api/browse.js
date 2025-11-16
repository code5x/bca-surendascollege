// /functions/api/browse.js
import { fetchTokenAndCsrf, postSearchForm, parseBooksHtml } from "../_lib";

export async function onRequestPost(context) {
  try {
    const req = context.request;
    const body = await req.json();
    const { type = "topic", query = "", limits = "20", cPageNo = "" } = body;

    // map incoming type -> IndCat field
    const map = {
      author: "author",
      subject: "topic",
      year: "publishDate",
      publisher: "publisher",
      place: "place_text",
      catalogue: "catalogue",
    };
    const field = map[type] || "topic";

    const { cookies, csrf } = await fetchTokenAndCsrf();
    const searchHTML = await postSearchForm({ csrf, cookies, field, query, limits, opt: "exact", cPageNo });

    const { results, stats, html } = parseBooksHtml(searchHTML);
    return new Response(JSON.stringify({ success: true, stats, results, html }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
