import { parseBooks, UNIVERSITY_CODE } from "../_indcatutils.js";

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { query, opt = "exact", limits = "20", field = "title", cPageNo = "" } = body;

    // First fetch to get CSRF + cookies
    const r1 = await fetch("https://indcat.inflibnet.ac.in/index.php/main/book", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const cookies = r1.headers.get("set-cookie") || "";
    const html = await r1.text();
    const csrf = html.match(/name="csrf_test_name"\s+value="([^"]+)"/)?.[1];

    const payload = new URLSearchParams({
      csrf_test_name: csrf,
      search_type: "simple",
      part_uni: UNIVERSITY_CODE,
      title: query,
      field,
      submit: "Search",
      opt,
      limits,
      cPageNo
    });

    // Actual search request
    const r2 = await fetch("https://indcat.inflibnet.ac.in/index.php/search/checkuniv", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        Cookie: cookies,
        Referer: "https://indcat.inflibnet.ac.in/index.php/main/book"
      },
      body: payload
    });

    const searchHTML = await r2.text();
    const { results, stats } = parseBooks(searchHTML);

    return Response.json({ success: true, results, stats });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
