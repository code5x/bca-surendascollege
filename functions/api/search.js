// functions/api/search.js
export async function onRequestPost(context) {
  const UNIVERSITY_CODE = "SUDC_781102";

  // Helper to extract query from multiple body types
  async function extractQuery(request) {
    // 1) try JSON
    try {
      const j = await request.json();
      if (j && (j.query || j.title)) {
        return { source: "json", data: j, query: (j.query ?? j.title) };
      }
    } catch (e) {
      // not JSON - ignore
    }

    // 2) try FormData (multipart/form-data or application/x-www-form-urlencoded)
    try {
      const form = await request.formData();
      // formData has .get()
      if (form && (form.get("query") || form.get("title"))) {
        const q = form.get("query") ?? form.get("title");
        // convert to plain object for other params
        const obj = {};
        for (const pair of form.entries()) obj[pair[0]] = pair[1];
        return { source: "formData", data: obj, query: q };
      }
    } catch (e) {
      // not form data - ignore
    }

    // 3) try plain text / urlencoded body
    try {
      const txt = await request.text();
      if (txt && txt.trim().length) {
        // try parse as urlencoded
        try {
          const params = new URLSearchParams(txt);
          if (params.has("query") || params.has("title")) {
            const q = params.get("query") ?? params.get("title");
            const obj = {};
            for (const [k, v] of params.entries()) obj[k] = v;
            return { source: "urlencoded-text", data: obj, query: q };
          }
        } catch (e) {
          // fallback: return raw text
          return { source: "text", data: txt, query: null, rawText: txt };
        }
      }
    } catch (e) {
      // ignore
    }

    // 4) check URL querystring (e.g. POST to /api/search?query=...)
    try {
      const url = new URL(context.request.url);
      const qp = url.searchParams.get("query") ?? url.searchParams.get("title");
      if (qp) return { source: "querystring", data: null, query: qp };
    } catch (e) {}

    // nothing found
    return { source: "none", data: null, query: null };
  }

  try {
    // extract payload robustly
    const extracted = await extractQuery(context.request);
    console.log("search.extract:", extracted.source);

    if (!extracted.query) {
      // helpful debug response so you can see what the function received
      return new Response(
        JSON.stringify({
          success: false,
          error: "No query",
          debug: {
            detected_source: extracted.source,
            received: extracted.data ?? extracted.rawText ?? null,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const query = extracted.query.trim();
    // optional other params from extracted.data
    const opt = (extracted.data && (extracted.data.opt || extracted.data.options)) || "exact";
    const limits = (extracted.data && (extracted.data.limits || "20")) || "20";
    const field = (extracted.data && (extracted.data.field || "title")) || "title";
    const cPageNo = (extracted.data && (extracted.data.cPageNo || "")) || "";

    // --- now run same scraping flow you had before ---
    // fetch token page to get CSRF and cookies
    const tokenRes = await fetch("https://indcat.inflibnet.ac.in/index.php/main/book", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const cookies = tokenRes.headers.get("set-cookie");
    const html = await tokenRes.text();

    // We must parse CSRF token from HTML using HTMLRewriter.
    // Use a simple one-off HTMLRewriter to capture the input[name=csrf_test_name] value.
    let csrf = null;
    await new HTMLRewriter()
      .on("input[name='csrf_test_name']", {
        element(el) {
          try {
            csrf = el.getAttribute("value");
          } catch (e) {
            csrf = null;
          }
        }
      })
      .transform(new Response(html))
      .text();

    // Build payload same as original server
    const payload = new URLSearchParams({
      csrf_test_name: csrf || "",
      search_type: "simple",
      part_uni: UNIVERSITY_CODE,
      title: query,
      field,
      submit: "Search",
      opt,
      limits,
      cPageNo,
    });

    const searchRes = await fetch("https://indcat.inflibnet.ac.in/index.php/search/checkuniv", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        Referer: "https://indcat.inflibnet.ac.in/index.php/main/book",
        Cookie: cookies || "",
      },
      body: payload.toString(),
    });

    const searchHTML = await searchRes.text();

    // Parse results using HTMLRewriter. Keep same fields you had before.
    const results = [];
    let currentBoxHtml = "";
    // We'll collect per .box1 node and process after we get its full innerHTML
    await new HTMLRewriter()
      .on(".box1", {
        element(el) {
          // ignore the final download box: must contain a link with getDetails
          // We'll get innerHTML via el.getAttribute("innerHTML") is not available,
          // so accumulate text nodes and capture anchors and inner text.
        },
        // collect anchors and text via child handlers below
      })
      // capture link, author <p>, and publication div using separate selectors
      .on(".box1 a[href*='getDetails']", {
        element(el) {
          // each anchor in a relevant box -> create a new result object
          const href = el.getAttribute("href");
          const title = el.text || "";
          results.push({
            title: title.trim().replace(/\s+/g, " "),
            bookUrl: href,
            author: "",
            publisher: "",
            year: "",
          });
        }
      })
      .on(".box1 .checkbox_bottomText p", {
        text(t) {
          // this text is like "Author : Sinha, P.K"
          const txt = t.text.trim();
          if (!txt) return;
          // assign to the last pushed result (same box)
          const last = results[results.length - 1];
          if (!last) return;
          const m = /Author\s*:\s*(.*)/i.exec(txt);
          if (m) last.author = m[1].trim();
        }
      })
      .on(".box1 .checkbox_bottomText .col-md-8", {
        text(t) {
          const txt = t.text.trim();
          if (!txt) return;
          const last = results[results.length - 1];
          if (!last) return;
          // example: "Publication Details : BPB Publications, New Delhi, 2007"
          const m = /Publication Details\s*:\s*(.*)/i.exec(txt);
          if (m) {
            const pub = m[1].trim();
            last.publisher = pub;
            // try to extract year
            const ym = pub.match(/\b(19\d{2}|20\d{2})\b/);
            if (ym) last.year = ym[0];
          }
        }
      })
      .transform(new Response(searchHTML));

    // filter out boxes without getDetails (extra download box would not have been added)
    const filtered = results.filter((r) => r.bookUrl && r.bookUrl.includes("getDetails"));

    return new Response(JSON.stringify({ success: true, stats: {}, results: filtered, rawCount: filtered.length }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("search.error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
