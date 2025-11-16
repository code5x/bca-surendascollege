// functions/api/bookdetails.js
import { parse } from "node-html-parser";

/**
 * Cloudflare Pages Function for /api/bookdetails
 * Accepts GET with query param `url`
 * Returns JSON { success, book }
 */

function getValFromDoc(root, label) {
  // tries to find a td.detailpage-title that contains label, then the next td
  // We will search for any element text containing label and try to take sibling
  const candidates = root.querySelectorAll("td.detailpage-title");
  for (const td of candidates) {
    const txt = (td.text || "").trim();
    if (txt.includes(label)) {
      const next = td.nextElementSibling;
      if (next) return (next.text || "").trim();
    }
  }
  // fallback: search by text nodes
  const allText = root.text;
  const m = allText.match(new RegExp(label.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\s*[:\\-]?\\s*(.*?)\\n", "i"));
  if (m) return (m[1] || "").trim();
  return "";
}

export default async function (request) {
  try {
    const url = new URL(request.url);
    const bookUrl = url.searchParams.get("url");
    if (!bookUrl) {
      return new Response(JSON.stringify({ success: false, error: "Missing URL" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const pageRes = await fetch(bookUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await pageRes.text();
    const root = parse(html);

    const book = {};

    const getVal = (label) => getValFromDoc(root, label);

    book.title = (root.querySelector("h1.underline") ? root.querySelector("h1.underline").text.trim() : "") || getVal("Title :-");
    book.author = getVal("Author :-");
    book.edition = getVal("Edition :-");
    book.isbn = getVal("ISBN :-");
    book.publisher = getVal("Place & Publisher :-");
    book.year = getVal("Date of Publication :-");
    book.pages = getVal("Pages :-");
    book.subjects = getVal("Subject Descriptors:-");
    book.language = getVal("Language :-");
    book.classNo = getVal("Class no:");
    book.catalogue = getVal("Catalogue Agency :-");

    // Extract holdings rows from table.bookdetail-bottom-table
    const holdings = [];
    const table = root.querySelector("table.bookdetail-bottom-table");
    if (table) {
      const rows = table.querySelectorAll("tr");
      for (let i = 1; i < rows.length; i++) {
        const tds = rows[i].querySelectorAll("td");
        if (tds.length >= 3) {
          const copyNo = (tds[0].text || "").trim();
          const accession = (tds[1].text || "").trim();
          const shelving = (tds[2].text || "").trim();
          const key = `${copyNo}-${accession}-${shelving}`;
          if (!holdings.some(h => `${h.copyNo}-${h.accession}-${h.shelving}` === key)) {
            holdings.push({ copyNo, accession, shelving });
          }
        }
      }
    }

    book.holdings = holdings;

    if (!book.title) {
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch book details." }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: true, book }), {
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
