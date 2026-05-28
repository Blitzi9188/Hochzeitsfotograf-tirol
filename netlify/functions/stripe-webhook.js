const { handleStripeWebhook } = require("../../lib/preset-delivery");
const { buildReq, json, text } = require("./_academy-http");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return text(405, "Method Not Allowed");
    }

    const signature =
      event.headers["stripe-signature"] ||
      event.headers["Stripe-Signature"] ||
      "";

    const rawBodyBuffer = Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8");

    const result = await handleStripeWebhook({
      rootDir: process.cwd(),
      req: buildReq(event),
      rawBodyBuffer,
      signature
    });
    return json(200, result);
  } catch (error) {
    return text(500, error?.message || "Webhook failed");
  }
};
