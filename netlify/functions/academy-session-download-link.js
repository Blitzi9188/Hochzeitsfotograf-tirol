const { createSessionDownloadLink } = require("../../lib/preset-delivery");
const { buildReq, json, query, text } = require("./_academy-http");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return text(405, "Method Not Allowed");
    }
    const params = query(event);
    const result = await createSessionDownloadLink({
      rootDir: process.cwd(),
      req: buildReq(event),
      sessionId: String(params.get("session_id") || ""),
      slug: String(params.get("entry") || ""),
      type: String(params.get("type") || ""),
      lang: String(params.get("lang") || "")
    });
    return json(200, { ok: true, ...result });
  } catch (error) {
    return text(500, error?.message || "Download link creation failed");
  }
};
