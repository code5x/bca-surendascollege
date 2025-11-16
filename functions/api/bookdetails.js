export async function onRequestGet({ request }) {
  const url = new URL(request.url).searchParams.get("url");
  if (!url)
    return new Response(
      JSON.stringify({ success: false, error: "Missing URL" }),
      { status: 400 }
    );

  try {
    const pageRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await pageRes.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    const book = {};
    const getVal = (label) => {
      const cell = Array.from(doc.querySelectorAll("td.detailpage-title"))
        .find((td) => td.textContent.includes(label));
      return cell?.nextElementSibling?.textContent.trim() || "";
    };

    book.title = doc.querySelector("h1.underline")?.textContent.trim() || getVal("Title :-");
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

    // holdings
    const holdings = [];
    const rows = doc.querySelectorAll("table.bookdetail-bottom-table tr");
    rows.forEach((row, i) => {
      if (i === 0) return;
      const tds = row.querySelectorAll("td");
      if (tds.length >= 3) {
        const copyNo = tds[0].textContent.trim();
        const accession = tds[1].textContent.trim();
        const shelving = tds[2].textContent.trim();
        const key = `${copyNo}-${accession}-${shelving}`;
        if (!holdings.some((h) => `${h.copyNo}-${h.accession}-${h.shelving}` === key)) {
          holdings.push({ copyNo, accession, shelving });
        }
      }
    });

    book.holdings = holdings;

    if (!book.title)
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch book details" }),
        { status: 200 }
      );

    return new Response(JSON.stringify({ success: true, book }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500
    });
  }
}
