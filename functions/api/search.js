import { parseBooks } from "../_indcatutils.js";

export async function onRequestPost(context) {
  const UNIVERSITY_CODE = "SUDC_781102";
  const req = await context.request.json();
  const { query, opt = "exact", limits = "20", field = "title", cPageNo = "" } = req;

  try {
      const tokenRes = await fetch("https://indcat.inflibnet.ac.in/index.php/main/book");
      const cookies = tokenRes.headers.get("set-cookie") || "";
      const pageHTML = await tokenRes.text();

      const csrf = (pageHTML.match(/name="csrf_test_name" value="([^"]+)"/) || [])[1];

      const payload = new URLSearchParams({
        csrf_test_name: csrf,
        search_type: "simple",
        part_uni: UNIVERSITY_CODE,
        title: query,
        field,
        submit: "Search",
        opt,
        limits,
        cPageNo,
      });

      const res2 = await fetch("https://indcat.inflibnet.ac.in/index.php/search/checkuniv", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: cookies,
        },
        body: payload
      });

      const html = await res2.text();
      const data = parseBooks(html);
      return Response.json({ success: true, ...data });

  } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
