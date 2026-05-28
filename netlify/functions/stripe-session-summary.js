const { fetchCheckoutSessionSummary } = require("../../lib/preset-delivery");
const { json, query, text } = require("./_academy-http");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return text(405, "Method Not Allowed");
    }
    const params = query(event);
    const sessionId = String(params.get("session_id") || "");
    const result = await fetchCheckoutSessionSummary({ sessionId });
    return json(200, { ok: true, ...result });
  } catch (error) {
    return text(500, error?.message || "Session summary failed");
  }
};
