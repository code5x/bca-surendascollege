export async function onRequestPost({ request }) {
  const UNIVERSITY_CODE = "SUDC_781102";

  const fieldMap = {
    author: "author",
    subject: "topic",
    year: "publishDate",
    publisher: "publisher",
    place: "place_text",
    catalogue: "catalogue"
  };

  try {
    const { type = "topic", query = "", limits = "20", cPageNo = "" } =
      await request.json();

    const field = fieldMap[type] || "topic";

    // CSRF
    const tokenRes = await fetch(
      "https://indcat.inflibnet.ac.in/index.php/main/book",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const cookies = tokenRes.headers.get("set-cookie");
    const html = await tokenRes.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const csrf = doc.querySelector("input[name='csrf_test_name']")?.value;

    // SEARCH
    const payload = new URLSearchParams({
      csrf_test_name: csrf,
      search_type: "simple",
      part_uni: UNIVERSITY_CODE,
      title: query,
      field,
      submit: "Search",
      opt: "exact",
      limits,
      cPageNo
    });

    const res2 = await fetch(
      "https://indcat.inflibnet.ac.in/index.php/search/checkuniv",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
          Referer: "https://indcat.inflibnet.ac.in/index.php/main/book",
          Cookie: cookies
        },
        body: payload
      }
    );

    const searchHTML = await res2.text();
    const data = parseBooks(searchHTML);

    return new Response(JSON.stringify({ success: true, ...data }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500
    });
  }
}


// reuse same parseBooks as in search.js
function parseBooks(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const results = [];
  const stats = {};

  const text = doc.body.textContent;

  const uniqueMatch = text.match(/Unique\s*Records\s*:\s*(\d+)/i);
  const holdingsMatch = text.match(/Holdings\s*:\s*(\d+)/i);
  const totalMatch = text.match(/Total\s+(\d+)\s+Records\s+found/i);

  if (uniqueMatch) stats.uniqueRecords = uniqueMatch[1];
  if (holdingsMatch) stats.holdings = holdingsMatch[1];
  if (totalMatch) stats.totalRecords = parseInt(totalMatch[1]);

  doc.querySelectorAll(".box1").forEach((box) => {
    const a = box.querySelector("a[href*='book_search?getDetails']");
    if (!a) return;

    const title = a.textContent.trim().replace(/\s+/g, " ");
    const bookUrl = a.getAttribute("href");

    const bottom = box.querySelector(".checkbox_bottomText");
    const authorText = bottom?.querySelector("p")?.textContent || "";
    const author = /Author\s*:\s*(.*)/i.exec(authorText)?.[1] || "";

    const pubText = bottom?.querySelector("div.col-md-8")?.textContent.trim() || "";
    const year = /\b(19\d{2}|20\d{2})\b/.exec(pubText)?.[0] || "";
    const publisher = pubText.split(",").slice(0, -1).join(", ");

    results.push({ title, author, publisher, year, bookUrl });
  });

  return { results, stats };
}
