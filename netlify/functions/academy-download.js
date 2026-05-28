const { buildBundleDownloadPayload } = require("../../lib/preset-delivery");
const { query, text } = require("./_academy-http");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return text(405, "Method Not Allowed");
    }
    const token = String(query(event).get("token") || "");
    if (!token) {
      return text(400, "Missing token");
    }
    const payload = await buildBundleDownloadPayload({
      rootDir: process.cwd(),
      token
    });
    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        "Content-Type": payload.contentType,
        "Content-Disposition": payload.contentDisposition,
        "Cache-Control": "private, no-store"
      },
      body: payload.body.toString("base64")
    };
  } catch (error) {
    return text(500, error?.message || "Download failed");
  }
};
