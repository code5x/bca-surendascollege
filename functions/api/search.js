import { parseBooks } from "../_indcatutils.js";

export async function onRequestPost({ request }) {
  try {
    const { query, opt = "exact", limits = "20", field = "title", cPageNo = "" } =
      await request.json();

    const tokenRes = await fetch("https://indcat.inflibnet.ac.in/index.php/main/book");
    const cookies = tokenRes.headers.get("set-cookie") || "";
    const html = await tokenRes.text();

    const csrf = html.match(/name="csrf_test_name" value="([^"]+)"/)?.[1];

    const form = new URLSearchParams({
      csrf_test_name: csrf,
      search_type: "simple",
      part_uni: "SUDC_781102",
      title: query,
      field,
      submit: "Search",
      opt,
      limits,
      cPageNo,
    });

    const res2 = await fetch("https://indcat.inflibnet.ac.in/index.php/search/checkuniv", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookies,
      },
      body: form,
    });

    const html2 = await res2.text();
    const { results, stats } = parseBooks(html2);

    return new Response(JSON.stringify({ success: true, stats, results }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }));
  }
}
