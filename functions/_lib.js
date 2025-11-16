// /functions/_lib.js
export const UNIVERSITY_CODE = "SUDC_781102";

/**
 * Helper: fetch the "main/book" page to obtain cookies and csrf token.
 * Returns { cookies, csrf, html }.
 */
export async function fetchTokenAndCsrf() {
  const resp = await fetch("https://indcat.inflibnet.ac.in/index.php/main/book", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const cookies = resp.headers.get("set-cookie") || "";
  const html = await resp.text();

  // crude csrf extraction
  const m = html.match(/name=['"]csrf_test_name['"]\s+value=['"]([^'"]+)['"]/i) ||
            html.match(/name=['"]csrf_test_name['"]\s*>\s*<input[^>]*value=['"]([^'"]+)['"]/i);
  const csrf = m ? m[1] : "";

  return { cookies, csrf, html };
}

/**
 * Basic parsing for search/browse HTML returned from IndCat.
 * Returns { results: [...], stats: {...}, html }.
 *
 * NOTE: this uses robust regex-based extraction tailored to the structure
 * of IndCat pages: finds <a ...book_search?getDetails...> for title/url,
 * and the nearby .checkbox_bottomText for author/publisher/year.
 */
export function parseBooksHtml(html) {
  const results = [];
  const text = html.replace(/\r\n/g,'\n');

  const stats = {};
  const uniqueMatch = text.match(/Unique\s*Records\s*:\s*(\d+)/i);
  const holdingsMatch = text.match(/Holdings\s*:\s*(\d+)/i);
  const totalMatch = text.match(/Total\s+(\d+)\s+Records\s+found/i);

  if (uniqueMatch) stats.uniqueRecords = uniqueMatch[1];
  if (holdingsMatch) stats.holdings = holdingsMatch[1];
  if (totalMatch) stats.totalRecords = parseInt(totalMatch[1], 10);

  // Find all anchor occurrences linking to book details
  // We capture href and inner text (title)
  const anchorRegex = /<a\b[^>]*href=(["'])([^"']*book_search\?getDetails[^"']*)\1[^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[2];
    const title = match[3].replace(/<[^>]*>/g, "").replace(/\s+/g," ").trim();

    // after the anchor we expect a nearby div with class checkbox_bottomText
    const after = html.slice(match.index + match[0].length);
    // find checkbox_bottomText div content (up to its closing div)
    const bottomMatch = after.match(/<div[^>]*class=["']checkbox_bottomText["'][^>]*>([\s\S]*?)<\/div>/i);
    let author = "", publisher = "", year = "", pubDetails = "";
    if (bottomMatch) {
      const bottomHtml = bottomMatch[1];

      // Author: try to find "Author : ..." inside <p> or text
      const authorMatch = bottomHtml.match(/Author\s*[:\-]\s*([^<\n\r]+?)(?:<|$)/i)
                       || bottomHtml.match(/Author\s*[:\-]\s*([^;,\n\r]+)/i);
      if (authorMatch) author = authorMatch[1].trim();

      // Try to find a publisher line, often inside <div class="col-md-8"> or plain text
      const pubMatch = bottomHtml.match(/<div[^>]*class=["'][^"']*col-md-8[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
                    || bottomHtml.match(/Publisher\s*[:\-]\s*([^<\n\r]+?)(?:<|$)/i)
                    || bottomHtml.match(/<div[^>]*>(.*?)<\/div>/i);

      if (pubMatch) {
        pubDetails = pubMatch[1].replace(/<[^>]*>/g," ").trim();
        // year heuristic: first 4-digit 19xx/20xx
        const y = pubDetails.match(/\b(19\d{2}|20\d{2})\b/);
        if (y) year = y[0];
        // publisher heuristic: everything except the last comma-separated token
        const parts = pubDetails.split(",").map(s=>s.trim()).filter(Boolean);
        if (parts.length>1) publisher = parts.slice(0,-1).join(", ");
        else publisher = parts[0] || "";
      }
    }

    results.push({
      title,
      author,
      publisher,
      year,
      bookUrl: href,
    });
  }

  return { results, stats, html };
}

/** Helper to post the form to checkuniv and return HTML string */
export async function postSearchForm({ csrf, cookies, field, query, limits="20", opt="exact", cPageNo="" }) {
  const form = new URLSearchParams({
    csrf_test_name: csrf,
    search_type: "simple",
    part_uni: UNIVERSITY_CODE,
    title: query || "",
    field,
    submit: "Search",
    opt,
    limits,
    cPageNo,
  });

  const postRes = await fetch("https://indcat.inflibnet.ac.in/index.php/search/checkuniv", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://indcat.inflibnet.ac.in/index.php/main/book",
      "Cookie": cookies || "",
    },
    body: form.toString(),
  });

  const searchHTML = await postRes.text();
  return searchHTML;
}
