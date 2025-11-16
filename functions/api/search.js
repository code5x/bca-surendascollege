export async function onRequestPost({ request }) {
  const UNIVERSITY_CODE = "SUDC_781102";
  try {
    const body = await request.json();
    const {
      query,
      opt = "exact",
      limits = "20",
      field = "title",
      cPageNo = ""
    } = body;

    // STEP 1 — GET CSRF TOKEN + COOKIE
    const tokenRes = await fetch(
      "https://indcat.inflibnet.ac.in/index.php/main/book",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const cookies = tokenRes.headers.get("set-cookie");
    const html = await tokenRes.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const csrf = doc.querySelector("input[name='csrf_test_name']")?.value;

    // STEP 2 — SEND SEARCH REQUEST
    const payload = new URLSearchParams({
      csrf_test_name: csrf,
      search_type: "simple",
      part_uni: UNIVERSITY_CODE,
      title: query,
      field,
      submit: "Search",
      opt,
      limits,
      cPageNo
    });

    const searchRes = await fetch(
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

    const searchHTML = await searchRes.text();
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


// ------------------- Helper: parse Books -------------------
function parseBooks(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const results = [];
  const stats = {};

  // Extract stats from raw text
  const text = doc.body.textContent;

  const uniqueMatch = text.match(/Unique\s*Records\s*:\s*(\d+)/i);
  const holdingsMatch = text.match(/Holdings\s*:\s*(\d+)/i);
  const totalMatch = text.match(/Total\s+(\d+)\s+Records\s+found/i);

  if (uniqueMatch) stats.uniqueRecords = uniqueMatch[1];
  if (holdingsMatch) stats.holdings = holdingsMatch[1];
  if (totalMatch) stats.totalRecords = parseInt(totalMatch[1]);

  // Parse each book box
  const boxes = doc.querySelectorAll(".box1");
  boxes.forEach((box) => {
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
