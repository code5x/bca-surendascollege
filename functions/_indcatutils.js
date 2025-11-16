// functions/_indcatutils.js
export const UNIVERSITY_CODE = "SUDC_781102";

/**
 * Fetches the INDCAT landing page to obtain CSRF token and cookies.
 */
export async function fetchCsrfAndCookies() {
  const url = "https://indcat.inflibnet.ac.in/index.php/main/book";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  // Try multiple ways to find CSRF token
  let csrf = "";
  const m1 = html.match(/<input[^>]*name=['"]csrf_test_name['"][^>]*value=['"]([^'"]+)['"]/i);
  if (m1) csrf = m1[1];
  else {
    const m2 = html.match(/name=['"]csrf_test_name['"]\s+value=['"]([^'"]+)['"]/i);
    if (m2) csrf = m2[1];
  }
  const cookie = res.headers.get("set-cookie") || "";
  return { csrf, cookie, html };
}

/**
 * Parse search / browse HTML returned by INDCAT. This uses robust regex heuristics
 * to find each result block, title, author, publisher and year.
 *
 * Returns: { results: [ { title, author, publisher, year, bookUrl } ... ], stats: {...} }
 */
export function parseBooksHtml(html) {
  const stats = {};
  const text = html.replace(/\s+/g, " ");
  const uniqueMatch = text.match(/Unique\s*Records\s*:\s*(\d+)/i);
  const holdingsMatch = text.match(/Holdings\s*:\s*(\d+)/i);
  const totalMatch = text.match(/Total\s+(\d+)\s+Records\s+found/i);
  if (uniqueMatch) stats.uniqueRecords = uniqueMatch[1];
  if (holdingsMatch) stats.holdings = holdingsMatch[1];
  if (totalMatch) stats.totalRecords = totalMatch[1] ? parseInt(totalMatch[1]) : undefined;

  const results = [];

  // 1) split on typical result container; try a few class names
  const blocks = html.split(/<div[^>]*(?:class=['"][^'"]*(?:box1|result|book-item)[^'"]*['"])[^>]*>/i).slice(1);
  for (const block of blocks) {
    // find getDetails link anywhere inside block
    const aMatch = block.match(/<a[^>]*href=['"]([^'"]*book_search\?getDetails[^'"]*)['"][^>]*>([\s\S]*?)<\/a>/i);
    if (!aMatch) continue;
    let bookUrl = aMatch[1].trim();
    // ensure absolute url
    if (!bookUrl.startsWith("http")) {
      bookUrl = "https://indcat.inflibnet.ac.in/" + bookUrl.replace(/^\//, "");
    }
    const rawTitleHtml = aMatch[2] || "";
    const title = rawTitleHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    // try different spots for author/publisher strings
    let author = "";
    let publisher = "";
    let year = "";

    // 1. look for explicit "Author" label inside block
    let authorMatch = block.match(/Author\s*[:\-]\s*([^<\n\r;]+)/i);
    if (!authorMatch) authorMatch = block.match(/<p[^>]*>\s*([^<]{2,80})\s*<\/p>/i); // fallback
    if (authorMatch) author = authorMatch[1].replace(/<[^>]+>/g, "").trim();

    // 2. look for publisher / place & year
    // common pattern contains year (19xx|20xx). Search around year.
    const yearMatch = block.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      year = yearMatch[1];
      // try to capture publisher by finding nearest comma-separated phrase before year
      const beforeYear = block.split(year)[0];
      // take the last 120 characters before year and strip tags
      const cand = beforeYear.slice(-220).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      // candidate may contain publisher after a comma
      const pieces = cand.split(",").map(s => s.trim()).filter(Boolean);
      if (pieces.length) {
        publisher = pieces[pieces.length - 1];
      }
    } else {
      // fallback: try to find "Publisher" label
      const pMatch = block.match(/Publisher\s*[:\-]\s*([^<\n\r;]+)/i) || block.match(/Place\s*&\s*Publisher\s*[:\-]\s*([^<\n\r;]+)/i);
      if (pMatch) publisher = pMatch[1].replace(/<[^>]+>/g, "").trim();
    }

    // final sanitise
    author = (author || "").replace(/\s+/g, " ").trim();
    publisher = (publisher || "").replace(/\s+/g, " ").trim();

    results.push({ title, author, publisher, year, bookUrl });
  }

  return { results, stats };
}


/**
 * Parse a single book detail HTML page and find fields and holdings.
 * This version will find fields via:
 * - <h1 class="underline">Title</h1> OR table detailpage-title label style
 * - labels like "Author :-" or "Place & Publisher :-"
 * - holdings table by searching any table that contains "Accession" or "Shelving"
 */
export function parseBookDetailsHtml(html) {
  const book = {};
  // Title: h1.underline or first <h1>
  const titleMatch = html.match(/<h1[^>]*class=['"][^'"]*underline[^'"]*['"][^>]*>([\s\S]*?)<\/h1>/i) ||
                     html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (titleMatch) {
    book.title = titleMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  function getValByLabel(labelVariants = []) {
    for (const label of labelVariants) {
      // Try: <td class="detailpage-title">Label</td><td>value</td>
      const re1 = new RegExp(`<td[^>]*class=['"]detailpage-title['"][^>]*>\\s*${escapeForRegex(label)}\\s*<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, "i");
      const m1 = html.match(re1);
      if (m1) return m1[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      // Try inline label "Label :- value"
      const re2 = new RegExp(`${escapeForRegex(label)}\\s*[:\\-]{1,2}\\s*([^<\\n\\r]{1,200})`, "i");
      const m2 = html.match(re2);
      if (m2) return m2[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      // Try simple "Label: value" anywhere
      const re3 = new RegExp(`${escapeForRegex(label)}\\s*[:\\-]\\s*([^<\\n\\r]{1,200})`, "i");
      const m3 = html.match(re3);
      if (m3) return m3[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }
    return "";
  }

  // label variants to try
  book.author = getValByLabel(["Author :-", "Author:", "Author"]);
  book.edition = getValByLabel(["Edition :-", "Edition:", "Edition"]);
  book.isbn = getValByLabel(["ISBN :-", "ISBN:", "ISBN"]);
  book.publisher = getValByLabel(["Place & Publisher :-", "Place & Publisher:", "Publisher:", "Publisher"]);
  book.year = getValByLabel(["Date of Publication :-", "Date of Publication:", "Date of Publication", "Publication Year", "Year"]);
  book.pages = getValByLabel(["Pages :-", "Pages:", "Pages"]);
  book.subjects = getValByLabel(["Subject Descriptors:-", "Subject Descriptors:", "Subjects:"]);
  book.language = getValByLabel(["Language :-", "Language:", "Language"]);
  book.classNo = getValByLabel(["Class no:", "Class no", "Class Number"]);
  book.catalogue = getValByLabel(["Catalogue Agency :-", "Catalogue Agency:", "Catalogue Agency"]);

  if (!book.title) {
    // fallback: Title :- label
    const fallback = getValByLabel(["Title :-", "Title:", "Title"]);
    if (fallback) book.title = fallback;
  }

  // --- Holdings extraction ---
  const holdings = [];
  // find any table that has "Accession" header or "Copy No" etc
  const tableMatches = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/ig)];
  for (const m of tableMatches) {
    const tableHtml = m[1];
    if (!/Accession|Shelving|Copy No|Accession No/i.test(tableHtml)) continue;

    // collect rows
    const trMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/ig)];
    for (let i = 0; i < trMatches.length; i++) {
      const tr = trMatches[i][1];
      // find all <td> contents
      const tdMatches = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/ig)].map(x => x[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
      if (tdMatches.length >= 3) {
        const copyNo = tdMatches[0];
        const accession = tdMatches[1];
        const shelving = tdMatches[2];
        const key = `${copyNo}-${accession}-${shelving}`;
        if (!holdings.some(h => `${h.copyNo}-${h.accession}-${h.shelving}` === key)) {
          holdings.push({ copyNo, accession, shelving });
        }
      } else {
        // sometimes table uses headers and then detail layout: try to extract by column headers
        // fallback: try to parse rows where first cell is number
        const text = tr.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const parts = text.split(/\s{2,}|,/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 3) {
          const copyNo = parts[0], accession = parts[1], shelving = parts.slice(2).join(", ");
          const key = `${copyNo}-${accession}-${shelving}`;
          if (!holdings.some(h => `${h.copyNo}-${h.accession}-${h.shelving}` === key)) {
            holdings.push({ copyNo, accession, shelving });
          }
        }
      }
    }
  }

  book.holdings = holdings;
  return book;
}

// escape helper
function escapeForRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
