export async function onRequestPost({ request }) {
  let body;

  try {
    body = await request.json();
  } catch {
    return json({
      success: false,
      error: "Invalid JSON",
      debug: { received: null }
    });
  }

  // query must exist (even empty string allowed)
  if (body.query === undefined) {
    return json({
      success: false,
      error: "No query",
      debug: { received: body }
    });
  }

  const query = body.query;
  const opt = body.opt || "exact";
  const limits = body.limits || "20";
  const field = body.field || "title";
  const page = body.cPageNo || "1";

  // Build URL
  const url =
    `https://indcat.inflibnet.ac.in/index.php/search/searchResult?` +
    `search_option=${encodeURIComponent(opt)}` +
    `&search_field=${encodeURIComponent(field)}` +
    `&search_text=${encodeURIComponent(query)}` +
    `&page_length=${encodeURIComponent(limits)}` +
    `&cPageNo=${encodeURIComponent(page)}`;

  // Fetch from IndCat
  const resp = await fetch(url);
  const html = await resp.text();

  // Extract stats with HTMLRewriter
  const stats = {
    totalRecords: null,
    uniqueRecords: null,
    holdings: null
  };

  const rewriter = new HTMLRewriter()
    .on(".search_Result_SUM", {
      text(textChunk) {
        const t = textChunk.text().replace(/\s+/g, " ");

        const m1 = t.match(/Total\s+(\d+)/i);
        if (m1) stats.totalRecords = parseInt(m1[1]);

        const m2 = t.match(/Unique\s+(\d+)/i);
        if (m2) stats.uniqueRecords = parseInt(m2[1]);

        const m3 = t.match(/Holdings\s+(\d+)/i);
        if (m3) stats.holdings = parseInt(m3[1]);
      }
    });

  const out = await rewriter.transform(new Response(html)).text();

  return json({
    success: true,
    html: out,
    stats
  });
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "Content-Type": "application/json" }
  });
}
