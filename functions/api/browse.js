import { parseBooks, UNIVERSITY_CODE } from "../_indcatutils.js";

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { type = "subject", query = "", limits = "20", cPageNo = "" } = body;

    const fieldMap = {
      author: "author",
      subject: "topic",
      year: "publishDate",
      publisher: "publisher",
      place: "place_text",
      catalogue: "catalogue"
    };

    const field = fieldMap[type] || "topic";

    // Get CSRF
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
      opt: "exact",
      limits,
      cPageNo
    });

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

    const browseHTML = await r2.text();
    const { results, stats } = parseBooks(browseHTML);

    return Response.json({ success: true, results, stats });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
