export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { field, query } = body;

    const url = `https://sdcopac.informindia.co.in/cgi-bin/koha/opac-search.pl?idx=${field}&q=${encodeURIComponent(query)}`;

    const resp = await fetch(url);
    const html = await resp.text();

    let books = [];
    let current = null;

    const rewriter = new HTMLRewriter()
      .on(".box1", {
        element(el) {
          let hasDetailLink = false;

          el.querySelectorAll("a").forEach(a => {
            if (a.getAttribute("href")?.includes("getDetails")) {
              hasDetailLink = true;
              current = {
                title: "",
                url: "",
                author: "",
                publication: "",
                callno: "",
                holdings: "",
                doctype: "",
                availability: ""
              };
              current.url = "https://sdcopac.informindia.co.in" + a.getAttribute("href");
              current.title = a.textContent.trim();
            }
          });

          if (!hasDetailLink) return;
        },
        text(txt) {
          if (!current) return;

          let t = txt.text.trim();

          if (t.startsWith("Author")) {
            current.author = t.replace("Author :", "").trim();
          }
          else if (t.startsWith("Publication Details")) {
            current.publication = t.replace("Publication Details :", "").trim();
          }
          else if (t.startsWith("Call Number")) {
            current.callno = t.replace("Call Number :", "").trim();
          }
          else if (t.startsWith("Total Holdings")) {
            current.holdings = t.replace("Total Holdings :", "").trim();
          }
          else if (t.startsWith("Document Type")) {
            current.doctype = t.replace("Document Type :", "").trim();
          }
          else if (t.startsWith("Availability")) {
            current.availability = t.replace("Availability :", "").trim();
            books.push(current);
            current = null;
          }
        }
      });

    await rewriter.transform(new Response(html)).text();

    return new Response(JSON.stringify({ success: true, books }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
