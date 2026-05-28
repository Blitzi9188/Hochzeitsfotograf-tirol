const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const archiver = require("archiver");
const { PassThrough } = require("stream");
const Stripe = require("stripe");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");

const DEFAULT_LINK_HOURS = 72;

const ensureDir = async (dir) => {
  await fsp.mkdir(dir, { recursive: true });
};

const readJsonIfExists = async (filePath, fallback) => {
  try {
    return JSON.parse(await fsp.readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
};

const appendLog = async (rootDir, level, message, meta = {}) => {
  const runtimeDir = path.join(rootDir, "private", "runtime");
  await ensureDir(runtimeDir);
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    meta
  });
  await fsp.appendFile(path.join(runtimeDir, "academy-delivery.log"), `${line}\n`, "utf8");
};

const sanitizeFileName = (value) =>
  String(value || "download")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "download";

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  return new Stripe(secretKey);
};

const getSigningSecret = () => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY");
  }
  return secret;
};

const signValue = (value) =>
  crypto.createHmac("sha256", getSigningSecret()).update(value).digest("hex");

const createSignedToken = (payload) => {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signValue(encoded)}`;
};

const verifySignedToken = (token) => {
  const [encoded, providedSignature] = String(token || "").split(".");
  if (!encoded || !providedSignature) {
    throw new Error("Invalid token");
  }

  const expectedSignature = signValue(encoded);
  if (expectedSignature.length !== providedSignature.length) {
    throw new Error("Invalid token signature");
  }
  const isValid = crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
  if (!isValid) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid token payload");
  }

  if (!payload.expiresAt || Number(payload.expiresAt) < Date.now()) {
    throw new Error("Download link expired");
  }

  return payload;
};

const getBaseUrl = (req) => {
  const configured = String(process.env.DOWNLOAD_BASE_URL || "").trim().replace(/\/$/, "");
  if (configured) return configured;
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "127.0.0.1:8001";
  return `${proto}://${host}`;
};

const getAcademyDataPath = (rootDir) => path.join(rootDir, "content", "academy", "page.json");

const loadAcademyData = async (rootDir) =>
  JSON.parse(await fsp.readFile(getAcademyDataPath(rootDir), "utf8"));

const flattenAcademyEntries = (academyData) => [
  ...(Array.isArray(academyData.workshops) ? academyData.workshops.map((entry) => ({ ...entry, kind: "workshop" })) : []),
  ...(Array.isArray(academyData.presets) ? academyData.presets.map((entry) => ({ ...entry, kind: "preset" })) : [])
];

const normalizeAcademyEntry = (entry) => ({
  ...entry,
  slug: String(entry?.slug || ""),
  kind: String(entry?.kind || ""),
  title: String(entry?.title || entry?.titleEn || ""),
  titleEn: String(entry?.titleEn || entry?.title || ""),
  paymentType: String(entry?.paymentType || ""),
  stripePriceId: String(entry?.stripePriceId || ""),
  bundleId: String(entry?.bundleId || ""),
  productUrl: String(entry?.productUrl || ""),
  stripeUrl: String(entry?.stripeUrl || "")
});

const findAcademyEntry = async (rootDir, slug, type) => {
  const academyData = await loadAcademyData(rootDir);
  const entry = flattenAcademyEntries(academyData)
    .map(normalizeAcademyEntry)
    .find((item) => item.slug === slug && item.kind === type);

  return { academyData, entry };
};

const fetchCheckoutSessionSummary = async ({ sessionId }) => {
  if (!sessionId) {
    throw new Error("Missing sessionId");
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent.latest_charge", "invoice"]
  });

  const invoiceUrl =
    session?.invoice?.invoice_pdf ||
    session?.invoice?.hosted_invoice_url ||
    "";

  const receiptUrl =
    session?.payment_intent?.latest_charge?.receipt_url ||
    "";

  return {
    sessionId: session.id,
    customerEmail: session.customer_details?.email || session.customer_email || "",
    invoiceUrl,
    receiptUrl
  };
};

const getBundleDirectory = (rootDir, bundleId) => {
  const bundleDir = path.resolve(path.join(rootDir, "private", "downloads", bundleId));
  const downloadsRoot = path.resolve(path.join(rootDir, "private", "downloads"));
  if (!bundleDir.startsWith(`${downloadsRoot}${path.sep}`) && bundleDir !== downloadsRoot) {
    throw new Error("Invalid bundle directory");
  }
  return bundleDir;
};

const getProcessedSessionsPath = (rootDir) =>
  path.join(rootDir, "private", "runtime", "processed-checkout-sessions.json");

const readProcessedSessions = async (rootDir) =>
  readJsonIfExists(getProcessedSessionsPath(rootDir), {});

const writeProcessedSessions = async (rootDir, data) => {
  const runtimeDir = path.join(rootDir, "private", "runtime");
  await ensureDir(runtimeDir);
  await fsp.writeFile(getProcessedSessionsPath(rootDir), `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

const resolveMailTransport = () => {
  if (process.env.RESEND_API_KEY) {
    return {
      type: "resend",
      client: new Resend(process.env.RESEND_API_KEY),
      from: process.env.RESEND_FROM || process.env.SMTP_FROM || "onboarding@resend.dev"
    };
  }

  if (process.env.SMTP_HOST) {
    return {
      type: "smtp",
      client: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || Number(process.env.SMTP_PORT || 587) === 465,
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS || ""
            }
          : undefined
      }),
      from: process.env.SMTP_FROM || process.env.SMTP_USER || ""
    };
  }

  throw new Error("Missing RESEND_API_KEY or SMTP_* configuration");
};

const sendDownloadEmail = async ({ to, subject, html, text }) => {
  const transport = resolveMailTransport();
  if (!transport.from) {
    throw new Error("Missing sender address. Configure RESEND_FROM or SMTP_FROM");
  }

  if (transport.type === "resend") {
    await transport.client.emails.send({
      from: transport.from,
      to,
      subject,
      html,
      text
    });
    return;
  }

  await transport.client.sendMail({
    from: transport.from,
    to,
    subject,
    html,
    text
  });
};

const formatDeliveryEmail = ({ entry, bundleId, downloadUrl, expiresHours, lang }) => {
  const isEn = lang === "en";
  const subject = isEn
    ? `${entry.titleEn || entry.title} · your preset download`
    : `${entry.title || entry.titleEn} · dein Preset-Download`;

  const intro = isEn
    ? `Thank you for your purchase. Your preset bundle is ready.`
    : `Danke für deinen Kauf. Dein Preset-Bundle ist bereit.`;
  const bundleLine = isEn
    ? `Bundle: ${bundleId}`
    : `Bundle: ${bundleId}`;
  const expiresLine = isEn
    ? `The secure download link is valid for ${expiresHours} hours.`
    : `Der sichere Download-Link ist ${expiresHours} Stunden gültig.`;
  const installLine = isEn
    ? `The download package should contain your preset files and installation guide.`
    : `Das Download-Paket sollte deine Preset-Dateien und die Installationsanleitung enthalten.`;
  const cta = isEn ? `Download presets` : `Presets herunterladen`;

  const text = [
    intro,
    bundleLine,
    expiresLine,
    installLine,
    downloadUrl
  ].join("\n\n");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#1B1A18;line-height:1.7;">
      <p>${intro}</p>
      <p><strong>${bundleLine}</strong></p>
      <p>${expiresLine}</p>
      <p>${installLine}</p>
      <p style="margin:24px 0;">
        <a href="${downloadUrl}" style="display:inline-block;padding:14px 22px;background:#1B1A18;color:#fff;text-decoration:none;letter-spacing:0.14em;text-transform:uppercase;font-size:12px;">${cta}</a>
      </p>
      <p style="font-size:13px;color:#6F675E;">${downloadUrl}</p>
    </div>
  `;

  return { subject, html, text };
};

const createCheckoutSession = async ({ rootDir, req, slug, type, lang }) => {
  const { entry } = await findAcademyEntry(rootDir, slug, type);
  if (!entry) {
    throw new Error("Academy entry not found");
  }
  if (entry.paymentType !== "stripe") {
    throw new Error("Entry is not configured for Stripe Checkout");
  }
  if (!entry.stripePriceId) {
    throw new Error("Missing stripePriceId for entry");
  }
  if (!entry.bundleId) {
    throw new Error("Missing bundleId for entry");
  }

  const stripe = getStripeClient();
  const baseUrl = getBaseUrl(req);
  const checkoutLang = lang === "en" ? "en" : "de";
  const cancelUrl = `${baseUrl}/academy/item/?entry=${encodeURIComponent(entry.slug)}&type=${encodeURIComponent(entry.kind)}${checkoutLang === "en" ? "&lang=en" : ""}`;
  const successUrl = `${baseUrl}/academy/checkout-success/?session_id={CHECKOUT_SESSION_ID}&entry=${encodeURIComponent(entry.slug)}&type=${encodeURIComponent(entry.kind)}${checkoutLang === "en" ? "&lang=en" : ""}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [
      {
        price: entry.stripePriceId,
        quantity: 1
      }
    ],
    allow_promotion_codes: true,
    customer_creation: "always",
    metadata: {
      bundleId: entry.bundleId,
      academySlug: entry.slug,
      academyType: entry.kind,
      academyTitle: entry.title,
      stripePriceId: entry.stripePriceId,
      deliveryType: "academy-preset"
    }
  });

  await appendLog(rootDir, "info", "Created Stripe Checkout session", {
    entry: entry.slug,
    type: entry.kind,
    bundleId: entry.bundleId,
    sessionId: session.id
  });

  return { session, entry };
};

const createDownloadUrl = ({ req, bundleId, email, sessionId, entrySlug, lang }) => {
  const expiresHours = Number(process.env.DOWNLOAD_LINK_HOURS || DEFAULT_LINK_HOURS);
  const expiresAt = Date.now() + expiresHours * 60 * 60 * 1000;
  const token = createSignedToken({
    bundleId,
    email,
    sessionId,
    entrySlug,
    lang: lang === "en" ? "en" : "de",
    expiresAt
  });

  return {
    url: `${getBaseUrl(req)}/api/academy/download?token=${encodeURIComponent(token)}`,
    expiresHours
  };
};

const resolveCompletedSessionDelivery = async ({ rootDir, session }) => {
  const stripe = getStripeClient();
  let bundleId = session.metadata?.bundleId || "";
  let entrySlug = session.metadata?.academySlug || "";
  let entryType = session.metadata?.academyType || "preset";
  let stripePriceId = session.metadata?.stripePriceId || "";

  if (!bundleId || !stripePriceId) {
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 1,
      expand: ["data.price"]
    });
    const firstLine = lineItems.data[0];
    stripePriceId = stripePriceId || firstLine?.price?.id || "";
    bundleId = bundleId || firstLine?.price?.metadata?.bundleId || "";
  }

  const academyData = await loadAcademyData(rootDir);
  const entry = flattenAcademyEntries(academyData)
    .map(normalizeAcademyEntry)
    .find((item) =>
      (entrySlug && item.slug === entrySlug && item.kind === entryType) ||
      (bundleId && item.bundleId === bundleId) ||
      (stripePriceId && item.stripePriceId === stripePriceId)
    );

  if (!entry) {
    throw new Error("No Academy entry matches the completed checkout session");
  }

  bundleId = bundleId || entry.bundleId;
  if (!bundleId) {
    throw new Error("Bundle ID missing after checkout");
  }

  const customerEmail = session.customer_details?.email || session.customer_email || "";
  if (!customerEmail) {
    throw new Error("Customer email missing in completed checkout session");
  }

  const bundleDir = getBundleDirectory(rootDir, bundleId);
  const bundleStat = await fsp.stat(bundleDir).catch(() => null);
  if (!bundleStat) {
    throw new Error(`Bundle directory not found for ${bundleId}`);
  }

  const emailLang = String(session.locale || "").startsWith("de") ? "de" : "en";

  return {
    entry,
    bundleId,
    customerEmail,
    emailLang,
    stripePriceId
  };
};

const createSessionDownloadLink = async ({ rootDir, req, sessionId, slug, type, lang }) => {
  if (!sessionId) {
    throw new Error("Missing sessionId");
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.mode !== "payment") {
    throw new Error("Unsupported checkout mode");
  }
  if (session.payment_status !== "paid") {
    throw new Error("Checkout session not paid");
  }

  const delivery = await resolveCompletedSessionDelivery({ rootDir, session });
  if (slug && delivery.entry.slug !== slug) {
    throw new Error("Checkout session does not match requested entry");
  }
  if (type && delivery.entry.kind !== type) {
    throw new Error("Checkout session does not match requested type");
  }

  const resolvedLang = lang === "en" ? "en" : delivery.emailLang;
  const { url, expiresHours } = createDownloadUrl({
    req,
    bundleId: delivery.bundleId,
    email: delivery.customerEmail,
    sessionId: session.id,
    entrySlug: delivery.entry.slug,
    lang: resolvedLang
  });

  return {
    sessionId: session.id,
    bundleId: delivery.bundleId,
    entrySlug: delivery.entry.slug,
    entryType: delivery.entry.kind,
    email: delivery.customerEmail,
    downloadUrl: url,
    expiresHours
  };
};

const fulfillCheckoutSession = async ({ rootDir, req, session }) => {
  const processedSessions = await readProcessedSessions(rootDir);
  if (processedSessions[session.id]) {
    return { alreadyProcessed: true, record: processedSessions[session.id] };
  }
  const {
    entry,
    bundleId,
    customerEmail,
    emailLang,
    stripePriceId
  } = await resolveCompletedSessionDelivery({ rootDir, session });

  const { url: downloadUrl, expiresHours } = createDownloadUrl({
    req,
    bundleId,
    email: customerEmail,
    sessionId: session.id,
    entrySlug: entry.slug,
    lang: emailLang
  });

  const mail = formatDeliveryEmail({
    entry,
    bundleId,
    downloadUrl,
    expiresHours,
    lang: emailLang
  });

  await sendDownloadEmail({
    to: customerEmail,
    subject: mail.subject,
    html: mail.html,
    text: mail.text
  });

  processedSessions[session.id] = {
    sessionId: session.id,
    bundleId,
    entrySlug: entry.slug,
    entryType: entry.kind,
    stripePriceId: stripePriceId || entry.stripePriceId || "",
    email: customerEmail,
    sentAt: new Date().toISOString()
  };
  await writeProcessedSessions(rootDir, processedSessions);

  await appendLog(rootDir, "info", "Preset delivery email sent", {
    sessionId: session.id,
    bundleId,
    entrySlug: entry.slug,
    email: customerEmail
  });

  return { alreadyProcessed: false, record: processedSessions[session.id] };
};

const handleStripeWebhook = async ({ rootDir, req, rawBodyBuffer, signature }) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  }

  const stripe = getStripeClient();
  const event = stripe.webhooks.constructEvent(rawBodyBuffer, signature, secret);

  if (event.type !== "checkout.session.completed") {
    return { received: true, ignored: true, eventType: event.type };
  }

  const session = event.data.object;
  if (session.mode !== "payment") {
    return { received: true, ignored: true, reason: "unsupported_mode" };
  }

  const result = await fulfillCheckoutSession({ rootDir, req, session });
  return { received: true, eventType: event.type, ...result };
};

const streamBundleDownload = async ({ rootDir, res, token }) => {
  const payload = verifySignedToken(token);
  const bundleDir = getBundleDirectory(rootDir, payload.bundleId);
  const stat = await fsp.stat(bundleDir).catch(() => null);
  if (!stat) {
    throw new Error("Bundle not found");
  }

  await appendLog(rootDir, "info", "Download requested", {
    bundleId: payload.bundleId,
    email: payload.email,
    sessionId: payload.sessionId
  });

  if (stat.isFile()) {
    const filename = path.basename(bundleDir);
    res.writeHead(200, {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store"
    });
    fs.createReadStream(bundleDir).pipe(res);
    return;
  }

  const archiveName = `${sanitizeFileName(payload.entrySlug || payload.bundleId)}.zip`;
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${archiveName}"`,
    "Cache-Control": "private, no-store"
  });

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (error) => {
    if (!res.headersSent) {
      res.writeHead(500, {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      });
    }
    res.end(error.message || "Archive error");
  });
  archive.pipe(res);
  archive.directory(bundleDir, false);
  await archive.finalize();
};

const buildBundleDownloadPayload = async ({ rootDir, token }) => {
  const payload = verifySignedToken(token);
  const bundleDir = getBundleDirectory(rootDir, payload.bundleId);
  const stat = await fsp.stat(bundleDir).catch(() => null);
  if (!stat) {
    throw new Error("Bundle not found");
  }

  await appendLog(rootDir, "info", "Download requested", {
    bundleId: payload.bundleId,
    email: payload.email,
    sessionId: payload.sessionId,
    transport: "buffer"
  });

  if (stat.isFile()) {
    const filename = path.basename(bundleDir);
    return {
      body: await fsp.readFile(bundleDir),
      contentType: "application/octet-stream",
      contentDisposition: `attachment; filename="${filename}"`,
      isBinary: true
    };
  }

  const archiveName = `${sanitizeFileName(payload.entrySlug || payload.bundleId)}.zip`;
  const archive = archiver("zip", { zlib: { level: 9 } });
  const passthrough = new PassThrough();
  const chunks = [];

  const bufferPromise = new Promise((resolve, reject) => {
    passthrough.on("data", (chunk) => chunks.push(chunk));
    passthrough.on("end", () => resolve(Buffer.concat(chunks)));
    passthrough.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(passthrough);
  archive.directory(bundleDir, false);
  await archive.finalize();
  const body = await bufferPromise;

  return {
    body,
    contentType: "application/zip",
    contentDisposition: `attachment; filename="${archiveName}"`,
    isBinary: true
  };
};

module.exports = {
  buildBundleDownloadPayload,
  createCheckoutSession,
  createSessionDownloadLink,
  fetchCheckoutSessionSummary,
  handleStripeWebhook,
  streamBundleDownload,
  appendLog,
  findAcademyEntry
};
