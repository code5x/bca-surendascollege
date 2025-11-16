// functions/_utils_indcat.js

import * as cheerio from "cheerio";

export const UNIVERSITY_CODE = "SUDC_781102";

export function parseBooks(html) {
  const $ = cheerio.load(html);
  const results = [];
  const stats = {};

  const text = $("body").text();
  const uniqueMatch = text.match(/Unique\s*Records\s*:\s*(\d+)/i);
  const holdingsMatch = text.match(/Holdings\s*:\s*(\d+)/i);
  const totalMatch = text.match(/Total\s+(\d+)\s+Records\s+found/i);

  if (uniqueMatch) stats.uniqueRecords = uniqueMatch[1];
  if (holdingsMatch) stats.holdings = holdingsMatch[1];
  if (totalMatch) stats.totalRecords = parseInt(totalMatch[1]);

  $(".box1").each((_, el) => {
    const a = $(el).find("a[href*='book_search?getDetails']").first();
    if (!a.length) return;

    const title = a.text().replace(/\s+/g, " ").trim();
    const bookUrl = a.attr("href");

    const bottom = $(el).find(".checkbox_bottomText");
    const authorText = bottom.find("p").text().trim();
    const authorMatch = authorText.match(/Author\s*:\s*(.*)/i);
    const author = authorMatch ? authorMatch[1] : "";

    const pubText = bottom.find("div.col-md-8").text().trim();
    const yearMatch = pubText.match(/\b(19\d{2}|20\d{2})\b/);
    const year = yearMatch ? yearMatch[0] : "";
    const publisher = pubText.split(",").slice(0, -1).join(", ");

    results.push({
      title,
      author,
      publisher,
      year,
      bookUrl,
    });
  });

  return { results, stats };
}

export function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
