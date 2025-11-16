export function extractBetween(html, start, end) {
  const s = html.indexOf(start);
  if (s === -1) return "";
  const e = html.indexOf(end, s + start.length);
  if (e === -1) return "";
  return html.substring(s + start.length, e).trim();
}

/* ------------------ PARSE SEARCH/BROWSE RESULTS ------------------ */

export function parseBooks(html) {
  const results = [];
  const stats = {};

  const uniqueMatch = html.match(/Unique\s*Records\s*:\s*(\d+)/i);
  const holdingsMatch = html.match(/Holdings\s*:\s*(\d+)/i);
  const totalMatch = html.match(/Total\s+(\d+)\s+Records\s+found/i);

  if (uniqueMatch) stats.uniqueRecords = uniqueMatch[1];
  if (holdingsMatch) stats.holdings = holdingsMatch[1];
  if (totalMatch) stats.totalRecords = parseInt(totalMatch[1]);

  const boxes = html.split('<div class="box1"');

  for (let i = 1; i < boxes.length; i++) {
    const block = boxes[i];

    // Title + URL
    const linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/);
    if (!linkMatch) continue;
    const bookUrl = linkMatch[1];
    const rawTitle = linkMatch[2].replace(/<[^>]+>/g, "").trim();

    // Author
    const authMatch = block.match(/Author\s*:\s*([^<]+)/i);
    const author = authMatch ? authMatch[1].trim() : "";

    // Publisher + Year block
    let pub = "";
    let year = "";

    const pubMatch = block.match(/<div class="col-md-8">([\s\S]*?)<\/div>/);
    if (pubMatch) {
      const txt = pubMatch[1].replace(/<[^>]+>/g, "").trim();
      const yearMatch = txt.match(/\b(19\d{2}|20\d{2})\b/);
      if (yearMatch) year = yearMatch[0];
      pub = txt.replace(year, "").replace(/,\s*$/, "").trim();
    }

    results.push({
      title: rawTitle,
      author,
      publisher: pub,
      year,
      bookUrl,
    });
  }

  return { results, stats };
}


/* ------------------ PARSE BOOK DETAILS PAGE ------------------ */

export function parseBookDetails(html) {
  function get(label) {
    const pattern = new RegExp(`${label}\\s*</td>\\s*<td[^>]*>(.*?)<`, "i");
    const m = html.match(pattern);
    return m ? m[1].trim() : "";
  }

  const book = {};

  // Title
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/);
  book.title = h1Match ? h1Match[1].trim() : get("Title :-");

  book.author = get("Author :-");
  book.edition = get("Edition :-");
  book.isbn = get("ISBN :-");
  book.publisher = get("Place & Publisher :-");
  book.year = get("Date of Publication :-");
  book.pages = get("Pages :-");
  book.subjects = get("Subject Descriptors:-");
  book.language = get("Language :-");
  book.classNo = get("Class no:");
  book.catalogue = get("Catalogue Agency :-");

  /* ----- Holdings table ----- */
  const holdings = [];

  const rows = html.split("<tr>");
  for (let r of rows) {
    const cols = [...r.matchAll(/<td[^>]*>(.*?)<\/td>/g)].map(m =>
      m[1].replace(/<[^>]+>/g, "").trim()
    );

    if (cols.length >= 3 && /^\d+$/.test(cols[0])) {
      holdings.push({
        copyNo: cols[0],
        accession: cols[1],
        shelving: cols[2],
      });
    }
  }

  book.holdings = holdings;

  return book;
}
