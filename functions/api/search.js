// functions/api/search.js
import * as cheerio from "cheerio";
import { parseBooks, UNIVERSITY_CODE, jsonResponse } from "../_utils_indcat";

export async function onRequest(context) {
  try {
    const data = await context.request.json();
    const { query, opt = "exact", limits = "20", field = "title", cPageNo = "" } = data;

    // Get CSRF + cookies
    const tokenRes = await fetch("https://indcat.inflibnet.ac.in/index.php/main/book", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const cookies = tokenRes.headers.get("set-cookie") || "";
    const html = await tokenRes.text();
    const $ = cheerio.load(html);
    const csrf = $("input[name='csrf_test_name']").val();

    // Prepare form body
    const payload = new URLSearchParams({
      csrf_test_name: csrf,
      search_type: "simple",
      part_uni: UNIVERSITY_CODE,
      title: query,
      field,
      submit: "Search",
      opt,
      limits,
      cPageNo,
    });

    // Perform search
    const res2 = await fetch("https://indcat.inflibnet.ac.in/index.php/search/checkuniv", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        Referer: "https://indcat.inflibnet.ac.in/index.php/main/book",
        Cookie: cookies,
      },
      body: payload,
    });

    const searchHTML = await res2.text();
    const { results, stats } = parseBooks(searchHTML);

    return jsonResponse({ success: true, stats, results, html: searchHTML });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
