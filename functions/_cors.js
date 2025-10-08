// functions/_cors.js
export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*", // or set specific origin like https://your-site.pages.dev
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function handleOptions() {
  // Response for preflight OPTIONS
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
