// ======================= Helper: extract text safely ==========================
export function extract(regex, html) {
  const m = html.match(regex);
  return m ? m[1].trim() : "";
}

// ======================= Parse Search / Browse results ========================
export function parseBooks(html) {

  const results = [];

  // ---- Stats ----
  const stats = {};
  stats.uniqueRecords = extract(/Unique\s*Records\s*:\s*(\d+)/i, html);
  stats.holdings = extract(/Holdings\s*:\s*(\d+)/i, html);
  stats.totalRecords = parseInt(extract(/Total\s+(\d+)\s+Records\s+found/i, html) || "0");

  // ---- Each book entry (".box1") ----
  const boxRegex = /<div class="box1"[\s\S]*?<div class="checkbox"/gi;
  let match;

  while ((match = boxRegex.exec(html)) !== null) {
      const block = match[0];

      // Title + URL
      const title = extract(/<a[^>]*getDetails[^>]*>(.*?)<\/a>/i, block)
                     .replace(/\s+/g, " ");

      const bookUrl = extract(/<a[^>]*href="([^"]*getDetails[^"]*)"/i, block);

      // Author
      const author = extract(/Author\s*:\s*([^<]+)/i, block);

      // Publisher + Year
      const pubBlock = extract(/<div class="col-md-8">([\s\S]*?)<\/div>/i, block);
      const year = extract(/\b(19\d{2}|20\d{2})\b/, pubBlock);
      const publisher = pubBlock.replace(/<[^>]+>/g, "")
                                .replace(/(19\d{2}|20\d{2}).*/, "")
                                .trim();

      results.push({ title, author, publisher, year, bookUrl });
  }

  return { results, stats };
}



// ======================= Parse Book Details Page =============================
export function parseBookDetails(html) {

  const getField = (label) => 
    extract(new RegExp(label + `<\\/td>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, "i"), html);

  const book = {};

  book.title = extract(/<h1[^>]*class="underline"[^>]*>([\s\S]*?)<\/h1>/i, html)
               || getField("Title :-");

  book.author = getField("Author :-");
  book.edition = getField("Edition :-");
  book.isbn = getField("ISBN :-");
  book.publisher = getField("Place & Publisher :-");
  book.year = getField("Date of Publication :-");
  book.pages = getField("Pages :-");
  book.subjects = getField("Subject Descriptors:-");
  book.language = getField("Language :-");
  book.classNo = getField("Class no:");
  book.catalogue = getField("Catalogue Agency :-");

  // ----------------- Extract Holdings (No duplicates) -----------------
  const rows = html.match(/<tr>[\s\S]*?<\/tr>/gi) || [];
  const holdings = [];

  rows.forEach(row => {
    const cols = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(x => x[1].trim());
    if (cols.length >= 3 && /^\d+$/.test(cols[0])) {
      const record = {
        copyNo: cols[0],
        accession: cols[1],
        shelving: cols[2].replace(/<[^>]*>/g, "")
      };
      // avoid duplicates
      if (!holdings.some(h => h.copyNo === record.copyNo &&
                              h.accession === record.accession &&
                              h.shelving === record.shelving)) {
        holdings.push(record);
      }
    }
  });

  book.holdings = holdings;

  return book;
}
