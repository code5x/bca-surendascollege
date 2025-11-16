// functions/api/search.js
import { parse } from "node-html-parser";

/**
 * Cloudflare Pages Function for /api/search
 * Accepts POST JSON { query, opt, limits, field, cPageNo }
 * Returns JSON: { success, stats, results, html }
 */

const UNIVERSITY_CODE = "SUDC_781102";

function parseBooks(html) {
  const root = parse(html);
  const results = [];
  const stats = {};

  const bodyText = root.text;

  const uniqueMatch = bodyText.match(/Unique\s*Records\s*:\s*(\d+)/i);
  const holdingsMatch = bodyText.match(/Holdings\s*:\s*(\d+)/i);
  const totalMatch = bodyText.match(/Total\s+(\d+)\s+Records\s+found/i);

  if (uniqueMatch) stats.uniqueRecords = uniqueMatch[1];
  if (holdingsMatch) stats.holdings = holdingsMatch[1];
  if (totalMatch) stats.totalRecords = parseInt(totalMatch[1]);

  const boxes = root.querySelectorAll(".box1");
  for (const box of boxes) {
    const a = box.querySelector("a[href*='book_search?getDetails']");
    if (!a) continue;

    const title = a.text.replace(/\s+/g, " ").trim();
    let bookUrl = a.getAttribute("href") || "";
    bookUrl = bookUrl.trim();

    const bottom = box.querySelector(".checkbox_bottomText");
    let author = "";
    let publisher = "";
    let year = "";

    if (bottom) {
      const p = bottom.querySelector("p");
      const authorText = p ? p.text.replace(/\s+/g, " ").trim() : bottom.text.replace(/\s+/g, " ").trim();
      const authorMatch = authorText.match(/Author\s*[:\-]\s*(.+?)(?:Publisher|$)/i);
      if (authorMatch) author = authorMatch[1].trim();

      const div = bottom.querySelector("div.col-md-8") || bottom.querySelector("div");
      if (div) {
        const pubText = div.text.replace(/\s+/g, " ").trim();
        const y = pubText.match(/\b(19\d{2}|20\d{2})\b/);
        if (y) year = y[0];
        // try to infer publisher (all but last comma-separated part)
        const parts = pubText.split(",").map(s => s.trim()).filter(Boolean);
        if (parts.length > 1) publisher = parts.slice(0, -1).join(", ");
        else publisher = parts[0] || "";
      }
    }

    results.push({
      title,
      author,
      publisher,
      year,
      bookUrl
    });
  }

  return { results, stats };
}

export default async function (request) {
  try {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
    }

    const body = await request.json().catch(() => ({}));
    const {
      query = "",
      opt = "exact",
      limits = "20",
      field = "title",
      cPageNo = ""
    } = body;

    // First fetch to get csrf and cookies from the main book page
    const mainRes = await fetch("https://indcat.inflibnet.ac.in/index.php/main/book", {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const cookieHeader = mainRes.headers.get("set-cookie") || "";
    const mainHtml = await mainRes.text();
    const root = parse(mainHtml);
    const csrfInput = root.querySelector("input[name='csrf_test_name']");
    const csrf = csrfInput ? csrfInput.getAttribute("value") || "" : "";

    // Build form payload
    const form = new URLSearchParams();
    form.set("csrf_test_name", csrf);
    form.set("search_type", "simple");
    form.set("part_uni", UNIVERSITY_CODE);
    form.set("title", query);
    form.set("field", field);
    form.set("submit", "Search");
    form.set("opt", opt);
    form.set("limits", limits);
    form.set("cPageNo", cPageNo);

    const searchRes = await fetch("https://indcat.inflibnet.ac.in/index.php/search/checkuniv", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://indcat.inflibnet.ac.in/index.php/main/book",
        // pass cookies obtained from the first request if any
        ...(cookieHeader ? { "Cookie": cookieHeader.split(";").map(s => s.trim()).join("; ") } : {})
      },
      body: form.toString()
    });

    const searchHTML = await searchRes.text();
    const { results, stats } = parseBooks(searchHTML);

    return new Response(JSON.stringify({ success: true, stats, results, html: searchHTML }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
