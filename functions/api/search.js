// functions/api/search.js
import { fetchCsrfAndCookies, parseBooksHtml, UNIVERSITY_CODE } from "../_indcatutils.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(() => ({}));
  const query = body.query || "";
  const opt = body.opt || "exact";
  const limits = body.limits || "20";
  const field = body.field || "title";
  const cPageNo = body.cPageNo || "";

  try {
    // fetch csrf and cookies
    const { csrf, cookie } = await fetchCsrfAndCookies();

    // build form payload
    const payload = new URLSearchParams();
    payload.append("csrf_test_name", csrf);
    payload.append("search_type", "simple");
    payload.append("part_uni", UNIVERSITY_CODE);
    // INFLIBNET expects different fields; to mimic your original server, put query into 'title'
    payload.append("title", query);
    payload.append("field", field);
    payload.append("submit", "Search");
    payload.append("opt", opt);
    payload.append("limits", limits);
    payload.append("cPageNo", cPageNo);

    const res = await fetch("https://indcat.inflibnet.ac.in/index.php/search/checkuniv", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        Referer: "https://indcat.inflibnet.ac.in/index.php/main/book",
        Cookie: cookie || "",
      },
      body: payload.toString(),
    });

    const html = await res.text();
    const { results, stats } = parseBooksHtml(html);

    return new Response(JSON.stringify({ success: true, stats, results, html }), {
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
