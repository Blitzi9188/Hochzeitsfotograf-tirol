const { URLSearchParams } = require("url");

const buildReq = (event) => {
  const headers = { ...(event.headers || {}) };
  if (!headers.host && event.headers?.Host) {
    headers.host = event.headers.Host;
  }
  if (!headers["x-forwarded-host"] && headers.host) {
    headers["x-forwarded-host"] = headers.host;
  }
  if (!headers["x-forwarded-proto"]) {
    headers["x-forwarded-proto"] = "https";
  }
  return { headers };
};

const json = (statusCode, payload) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  },
  body: JSON.stringify(payload)
});

const text = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  },
  body: String(body || "")
});

const parseBody = (event) => {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
};

const query = (event) => new URLSearchParams(event.rawQuery || "");

module.exports = {
  buildReq,
  json,
  parseBody,
  query,
  text
};
