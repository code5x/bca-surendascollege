export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const url = body.url;
    if (!url) {
      return new Response(JSON.stringify({ success: false, error: "Missing URL" }), { status: 400 });
    }

    const resp = await fetch(url);
    const html = await resp.text();

    let data = {
      title: "",
      author: "",
      publication: "",
      callno: "",
      subject: "",
      abstract: "",
      language: "",
      holdings: []
    };

    let currentField = null;
    let collectingAbstract = false;

    const rewriter = new HTMLRewriter()
      .on("strong", {
        text(txt) {
          const t = txt.text.trim();

          if (t.startsWith("Author")) currentField = "author";
          else if (t.startsWith("Publication")) currentField = "publication";
          else if (t.startsWith("Call Number")) currentField = "callno";
          else if (t.startsWith("Subject Descriptor")) currentField = "subject";
          else if (t.startsWith("Abstract")) { currentField = "abstract"; collectingAbstract = true; }
          else if (t.startsWith("Language")) currentField = "language";
        }
      })
      .on("td", {
        text(txt) {
          if (currentField === "abstract" && collectingAbstract) {
            data.abstract += txt.text.trim() + " ";
          }
        }
      })
      .on("tbody tr", {
        element(el) {
          // holdings table rows: Copy No, Acc No, Location
          let row = [];
          el.querySelectorAll("td").forEach(td => row.push(td.textContent.trim()));
          if (row.length === 3 && /^\d+$/.test(row[0])) {
            data.holdings.push({
              copy: row[0],
              acc: row[1],
              location: row[2]
            });
          }
        }
      })
      .on("title", {
        text(txt) {
          data.title = txt.text.trim();
        }
      });

    await rewriter.transform(new Response(html)).text();

    return new Response(JSON.stringify({ success: true, book: data }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
