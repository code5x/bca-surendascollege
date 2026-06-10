// functions/share-book.js

export async function onRequestGet(context) {

  const reqUrl = new URL(context.request.url);

  const bookUrl = reqUrl.searchParams.get("url");

  if (!bookUrl) {
    return new Response("Missing URL", { status: 400 });
  }

  try {

    const apiUrl =
      `${reqUrl.origin}/api/bookdetails?url=` +
      encodeURIComponent(bookUrl);

    const apiRes = await fetch(apiUrl);
    const data = await apiRes.json();

    const title =
      data?.book?.title ||
      "Book Details";

    return new Response(`
<!doctype html>
<html>
<head>

<title>${escapeHtml(title)}</title>

<meta property="og:title"
      content="${escapeHtml(title)}">

<meta property="og:type"
      content="website">

</head>

<body>

<script>
location.replace(
  "/library-opac-book?url=${encodeURIComponent(bookUrl)}"
);
</script>

</body>
</html>
`, {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });

  } catch (err) {

    return new Response(
      "Error: " + err.message,
      { status: 500 }
    );

  }
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
