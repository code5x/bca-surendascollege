export const UNIVERSITY_CODE = "SUDC_781102";

// ------------------------- PARSE SEARCH/BROWSE -----------------------------
export function parseBooks(html) {
  const $ = cheerio.load(html);
  const results = [];
  const stats = {};

  // Stats
  const text = $("body").text();
  const totalMatch = text.match(/Total\s+(\d+)\s+Records\s+found/i);
  if (totalMatch) stats.totalRecords = parseInt(totalMatch[1]);

  // Record cards
  $(".box1").each((_, card) => {
    const a = $(card).find("a[href*='book_search?getDetails']").first();
    if (!a.length) return;

    const title = a.text().trim();
    const bookUrl = a.attr("href");

    // Fix: author is usually inside <p>Author : xyz</p>
    const pText = $(card).find(".checkbox_bottomText p").text().trim();
    const authorMatch = pText.match(/Author\s*:\s*(.*)/i);
    const author = authorMatch ? authorMatch[1].trim() : "";

    // Fix: publisher + year inside <div class="col-md-8">
    const pubBlock = $(card).find(".checkbox_bottomText .col-md-8").text().trim();

    let publisher = "";
    let year = "";

    const yearMatch = pubBlock.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) year = yearMatch[0];

    if (pubBlock.includes(",")) {
      const parts = pubBlock.split(",");
      publisher = parts.slice(0, -1).join(",").trim();
    } else {
      publisher = pubBlock;
    }

    results.push({ title, author, publisher, year, bookUrl });
  });

  return { results, stats };
}


// ------------------------- PARSE BOOK DETAILS -----------------------------
export function parseBookDetails(html) {
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

  // ------- FIXED HOLDINGS PARSER ----------
  const holdings = [];
  $("table.bookdetail-bottom-table tr").each((i, row) => {
    if (i === 0) return; // skip header

    const cells = $(row).find("td");
    if (cells.length < 3) return;

    const copyNo = $(cells[0]).text().trim();
    const accession = $(cells[1]).text().trim();
    const shelving = $(cells[2]).text().trim();

    if (!copyNo || !accession) return;

    holdings.push({ copyNo, accession, shelving });
  });

  book.holdings = holdings;

  return book;
}
