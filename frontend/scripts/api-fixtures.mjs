// Recorded-style API responses so parity tests never reach the live NVIDIA-backed Worker.
// `overrides` maps an endpoint name (e.g. "tutor") to a responder:
//   { json: object } | { sse: string[] } | { status: number, json: object }
export const statusOk = {
  enabled: true,
  configured: true,
  available: true,
  limits: { messageChars: 1200, writingChars: 4000, dailyPerClient: 150 },
  provider: "NVIDIA",
};

export function sse(chunks) {
  return (
    chunks
      .map((t) => `event: delta\ndata: ${JSON.stringify({ text: t })}\n\n`)
      .join("") + `event: done\ndata: {"finishReason":"stop"}\n\n`
  );
}

export async function mockApi(page, log, overrides = {}) {
  await page.route("**/api/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const name = url.pathname.replace(/^\/api\/(ai\/)?/, "");
    log.push([req.method(), url.pathname + url.search, req.postData()]);
    const o =
      overrides[name] ?? (name === "status" ? { json: statusOk } : null);
    if (!o)
      return route.fulfill({
        status: 503,
        json: { error: { code: "unavailable" } },
      });
    if (o.sse)
      return route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream" },
        body: sse(o.sse),
      });
    return route.fulfill({ status: o.status ?? 200, json: o.json });
  });
}
