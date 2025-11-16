// functions/_utils.js
export const UNIVERSITY_CODE = "SUDC_781102"; // change here if you want

// helper: extract csrf token value from the HTML of /main/book page
export async function fetchCsrfAndCookies() {
  const url = "https://indcat.inflibnet.ac.in/index.php/main/book";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  // Try to find input name='csrf_test_name' value='...'
  const m = html.match(/<input[^>]*name=['"]csrf_test_name['"][^>]*value=['"]([^'"]+)['"]/i);
  const csrf = m ? m[1] : "";
  // Get set-cookie header if present
  // Note: fetch on Cloudflare Workers returns combined 'set-cookie' as single header in some cases.
  const cookie = res.headers.get("set-cookie") || "";
  return { csrf, cookie, html };
}

// helper: parse the search/browse HTML that contains many ".box1" items.
// This function returns { results: [...], stats: {...} } similar to your node parseBooks.
export function parseBooksHtml(html) {
  const stats = {};
  // extract numbers seen in page text
  const text = html.replace(/\s+/g, " ");
  const uniqueMatch = text.match(/Unique\s*Records\s*:\s*(\d+)/i);
  const holdingsMatch = text.match(/Holdings\s*:\s*(\d+)/i);
  const totalMatch = text.match(/Total\s+(\d+)\s+Records\s+found/i);
  if (uniqueMatch) stats.uniqueRecords = uniqueMatch[1];
  if (holdingsMatch) stats.holdings = holdingsMatch[1];
  if (totalMatch) stats.totalRecords = totalMatch[1] ? parseInt(totalMatch[1]) : undefined;

  const results = [];

  // Split on box1 blocks. We look for <div class="box1" ...> ... </div>
  // This is a simple approach but works for the INFLIBNET markup you shared.
  const parts = html.split(/<div[^>]*class=['"]box1['"][^>]*>/i).slice(1);
  for (const part of parts) {
    // find link to getDetails
    const aMatch = part.match(/<a[^>]*href=['"]([^'"]*book_search\?getDetails[^'"]*)['"][^>]*>([\s\S]*?)<\/a>/i);
    if (!aMatch) continue;
    const bookUrl = aMatch[1].startsWith("http") ? aMatch[1] : "https://indcat.inflibnet.ac.in/" + aMatch[1].replace(/^\//, "");
    const title = (aMatch[2] || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();

    // bottom text area: try to extract Author and publisher/year info
    const bottomMatch = part.match(/class=['"]checkbox_bottomText['"][\s\S]*?>([\s\S]*?)<\/div>/i) || part.match(/class=['"]checkbox_bottomText['"][\s\S]*?>([\s\S]*)$/i);
    let author = "";
    let publisher = "";
    let year = "";

    if (bottomMatch) {
      const bottomHtml = bottomMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      // Author: ... pattern
      const aTxt = bottomHtml.match(/Author\s*[:\-]\s*([^;|,]+)(?:Publisher|$)/i);
      if (aTxt) author = aTxt[1].trim();
      // publisher & year: find a 4 digit year near 19xx or 20xx
      const y = bottomHtml.match(/\b(19\d{2}|20\d{2})\b/);
      if (y) year = y[0];
      // Publisher: try to extract from text. Heuristic: take part before the year or last comma before year
      if (year) {
        const beforeYear = bottomHtml.split(year)[0];
        const pieces = beforeYear.split(",");
        publisher = pieces.length ? pieces[pieces.length - 1].trim() : "";
      } else {
        // fallback: try to find "Publisher" label
        const p = bottomHtml.match(/Publisher\s*[:\-]\s*([^,;|]+)/i);
        if (p) publisher = p[1].trim();
      }
    }

    results.push({ title, author, publisher, year, bookUrl });
  }

  return { results, stats };
}

// helper: parse a single book details HTML page and extract the fields and holdings
export function parseBookDetailsHtml(html) {
  const book = {};
  // extract H1. underline
  const titleMatch = html.match(/<h1[^>]*class=['"]underline['"][^>]*>([\s\S]*?)<\/h1>/i);
  if (titleMatch) book.title = titleMatch[1].replace(/<[^>]+>/g, "").trim();

  // helper to get label -> next td text
  function getVal(label) {
    const re = new RegExp(`<td[^>]*class=['"]detailpage-title['"][^>]*>\\s*${label.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}\\s*<\\/td>[\\s\\S]*?<td[^>]*>([\\s\\S]*?)<\\/td>`, "i");
    const m = html.match(re);
    if (!m) return "";
    return m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  if (!book.title) book.title = getVal("Title :-");
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

  // holdings: find table rows inside table.bookdetail-bottom-table
  const rowsMatch = html.match(/<table[^>]*class=['"]bookdetail-bottom-table['"][^>]*>([\s\S]*?)<\/table>/i);
  const holdings = [];
  if (rowsMatch) {
    const tbodyHtml = rowsMatch[1];
    // match each <tr>...</tr> but skip header row if present
    const trMatches = [...tbodyHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/ig)];
    for (let i = 1; i < trMatches.length; i++) { // start at 1 to skip header if first row is header
      const tr = trMatches[i][1];
      const tdMatches = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/ig)].map(m => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      if (tdMatches.length >= 3) {
        const [copyNo, accession, shelving] = tdMatches;
        const key = `${copyNo}-${accession}-${shelving}`;
        if (!holdings.some(h => `${h.copyNo}-${h.accession}-${h.shelving}` === key)) {
          holdings.push({ copyNo, accession, shelving });
        }
      }
    }
  }

  book.holdings = holdings;
  return book;
}
