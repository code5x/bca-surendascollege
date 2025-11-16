// functions/api/bookdetails.js
import * as cheerio from "cheerio";
import { jsonResponse } from "../_utils_indcat";

export async function onRequest(context) {
  const url = new URL(context.request.url).searchParams.get("url");

  if (!url) {
    return jsonResponse({ success: false, error: "Missing URL" }, 400);
  }

  try {
    const pageRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = await pageRes.text();
    const $ = cheerio.load(html);

    const book = {};

    const getVal = (label) =>
      $(`td.detailpage-title:contains('${label}')`).next("td").text().trim();

    book.title = $("h1.underline").text().trim() || getVal("Title :-");
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

    // --- parse holdings ---
    const holdings = [];
    $("table.bookdetail-bottom-table tr")
      .slice(1)
      .each((i, el) => {
        const tds = $(el).find("td");
        if (tds.length < 3) return;

        const copyNo = $(tds[0]).text().trim();
        const accession = $(tds[1]).text().trim();
        const shelving = $(tds[2]).text().trim();

        const key = `${copyNo}-${accession}-${shelving}`;
        if (!holdings.some((h) => `${h.copyNo}-${h.accession}-${h.shelving}` === key)) {
          holdings.push({ copyNo, accession, shelving });
        }
      });

    book.holdings = holdings;

    if (!book.title) {
      return jsonResponse({
        success: false,
        error: "Failed to fetch book details.",
      });
    }

    return jsonResponse({ success: true, book });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
