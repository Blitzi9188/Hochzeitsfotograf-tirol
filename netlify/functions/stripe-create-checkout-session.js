const { createCheckoutSession } = require("../../lib/preset-delivery");
const { buildReq, json, parseBody, text } = require("./_academy-http");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return text(405, "Method Not Allowed");
    }
    const body = parseBody(event);
    const rootDir = process.cwd();
    const result = await createCheckoutSession({
      rootDir,
      req: buildReq(event),
      slug: String(body.slug || ""),
      type: String(body.type || ""),
      lang: String(body.lang || "")
    });
    return json(200, {
      ok: true,
      url: result.session.url,
      sessionId: result.session.id
    });
  } catch (error) {
    return text(500, error?.message || "Checkout session failed");
  }
};
