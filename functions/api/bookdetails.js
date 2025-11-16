// /functions/api/bookdetails.js
// GET handler that expects ?url=<full detail page URL>
export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url).searchParams.get("url");
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: "Missing URL" }), { status: 400, headers: { "Content-Type": "application/json" }});
    }

    const pageRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await pageRes.text();

    // Extract title via <h1 class="underline"> or the detail table
    const h1Match = html.match(/<h1[^>]*class=['"]underline['"][^>]*>([\s\S]*?)<\/h1>/i);
    const title = h1Match ? h1Match[1].replace(/<[^>]*>/g," ").trim() : "";

    // Extract label/value pairs from rows like:
    // <td class="detailpage-title">Title :-</td><td>value</td>
    const labelRegex = /<td[^>]*class=['"]detailpage-title['"][^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
    const details = {};
    let lm;
    while ((lm = labelRegex.exec(html)) !== null) {
      const label = lm[1].replace(/<[^>]*>/g,"").trim().replace(/\s+$/,"");
      const val = lm[2].replace(/<[^>]*>/g," ").trim().replace(/\s+/g," ");
      details[label] = val;
    }

    // normalized keys to match previous server.js expectations
    const b = {
      title: title || details["Title :-"] || details["Title - :"] || "",
      author: details["Author :-"] || "",
      edition: details["Edition :-"] || "",
      isbn: details["ISBN :-"] || "",
      publisher: details["Place & Publisher :-"] || "",
      year: details["Date of Publication :-"] || "",
      pages: details["Pages :-"] || "",
      subjects: details["Subject Descriptors:-"] || details["Subject Descriptors :-"] || "",
      language: details["Language :-"] || "",
      classNo: details["Class no:"] || "",
      catalogue: details["Catalogue Agency :-"] || "",
      holdings: []
    };

    // Extract holdings table rows inside <table class="bookdetail-bottom-table">...</table>
    const tableMatch = html.match(/<table[^>]*class=['"][^'"]*bookdetail-bottom-table[^'"]*['"][^>]*>([\s\S]*?)<\/table>/i);
    if (tableMatch) {
      const tableHtml = tableMatch[1];
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let first = true;
      let trm;
      while ((trm = trRegex.exec(tableHtml)) !== null) {
        // skip header row if present (common)
        if (first) { first = false; continue; }
        const row = trm[1];
        // get all td values
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const tds = [];
        let tdm;
        while ((tdm = tdRegex.exec(row)) !== null) {
          tds.push(tdm[1].replace(/<[^>]*>/g," ").trim().replace(/\s+/g," "));
        }
        if (tds.length >= 3) {
          b.holdings.push({ copyNo: tds[0]||"", accession: tds[1]||"", shelving: tds[2]||"" });
        }
      }
    }

    if (!b.title) {
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch book details." }), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    return new Response(JSON.stringify({ success: true, book: b }), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
