const fs = require("fs/promises");
const path = require("path");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");

const getSiteSettings = async (rootDir) => {
  const filePath = path.join(rootDir, "content", "settings", "site.json");
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
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

const sendMail = async ({ to, subject, html, text, replyTo }) => {
  const transport = resolveMailTransport();
  if (!transport.from) {
    throw new Error("Missing sender address. Configure RESEND_FROM or SMTP_FROM");
  }

  const normalizedReplyTo = String(replyTo || "").trim() || undefined;

  if (transport.type === "resend") {
    const result = await transport.client.emails.send({
      from: transport.from,
      to,
      replyTo: normalizedReplyTo,
      subject,
      html,
      text
    });
    return {
      provider: "resend",
      sender: transport.from,
      messageId: result?.data?.id || result?.id || null,
      response: "accepted"
    };
  }

  const result = await transport.client.sendMail({
    from: transport.from,
    to,
    replyTo: normalizedReplyTo,
    subject,
    html,
    text
  });

  return {
    provider: "smtp",
    sender: transport.from,
    messageId: result?.messageId || null,
    response: result?.response || null,
    accepted: Array.isArray(result?.accepted) ? result.accepted : [],
    rejected: Array.isArray(result?.rejected) ? result.rejected : []
  };
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const appendInquiryLog = async ({ rootDir, entry }) => {
  const runtimeDir = path.join(rootDir, "private", "runtime");
  const logPath = path.join(runtimeDir, "contact-inquiries.jsonl");
  await fs.mkdir(runtimeDir, { recursive: true });
  await fs.appendFile(logPath, `${JSON.stringify(entry)}\n`, "utf8");
};

const sendContactInquiry = async ({ rootDir, payload, meta = {} }) => {
  const siteSettings = await getSiteSettings(rootDir);
  const recipient = String(siteSettings.contactFormRecipient || siteSettings.contactDirectMail || siteSettings.email || "").trim();

  if (!recipient) {
    throw new Error("Missing contact form recipient in site settings");
  }

  const lang = String(payload.lang || "de") === "en" ? "en" : "de";
  const source = String(payload.source || "contact");
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const date = String(payload.date || "").trim();
  const location = String(payload.location || "").trim();
  const message = String(payload.message || "").trim();
  const referral = String(payload.referral || "").trim();

  if (!name || !email || !message) {
    throw new Error("Missing required contact fields: name, email or message");
  }

  const subjectDate = date || (lang === "en" ? "date open" : "Datum offen");
  const subjectLocation = location || (lang === "en" ? "location open" : "Ort offen");
  const subjectName = name || (lang === "en" ? "unknown name" : "ohne Namen");
  const subject = lang === "en"
    ? `Wedding inquiry | ${subjectDate} | ${subjectLocation} | ${subjectName}`
    : `Hochzeitsanfrage | ${subjectDate} | ${subjectLocation} | ${subjectName}`;

  const details = [
    [lang === "en" ? "Source" : "Quelle", source],
    [lang === "en" ? "Name" : "Name", name || "-"],
    [lang === "en" ? "Email" : "E-Mail", email || "-"],
    [lang === "en" ? "Preferred date" : "Wunschdatum", date || "-"],
    [lang === "en" ? "Location" : "Ort", location || "-"],
    [lang === "en" ? "How they found me" : "Wie sie mich gefunden haben", referral || "-"]
  ];

  const text = [
    lang === "en" ? "A new inquiry has been sent through the website." : "Eine neue Anfrage wurde über die Website gesendet.",
    "",
    ...details.map(([label, value]) => `${label}: ${value}`),
    "",
    `${lang === "en" ? "Message" : "Nachricht"}:`,
    message
  ].join("\n");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#1B1A18;line-height:1.7;">
      <p>${lang === "en" ? "A new inquiry has been sent through the website." : "Eine neue Anfrage wurde über die Website gesendet."}</p>
      <table style="border-collapse:collapse;margin:24px 0;">
        <tbody>
          ${details.map(([label, value]) => `
            <tr>
              <td style="padding:6px 18px 6px 0;font-weight:600;vertical-align:top;">${escapeHtml(label)}</td>
              <td style="padding:6px 0;vertical-align:top;">${escapeHtml(value)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <p style="font-weight:600;margin:0 0 10px;">${lang === "en" ? "Message" : "Nachricht"}</p>
      <div style="white-space:pre-wrap;">${escapeHtml(message)}</div>
    </div>
  `;

  const logEntryBase = {
    timestamp: new Date().toISOString(),
    recipient,
    subject,
    source,
    lang,
    name: name || "",
    email: email || "",
    date: date || "",
    location: location || "",
    referral: referral || "",
    message,
    ip: String(meta.ip || ""),
    userAgent: String(meta.userAgent || "")
  };

  try {
    const delivery = await sendMail({
      to: recipient,
      replyTo: email,
      subject,
      html,
      text
    });

    await appendInquiryLog({
      rootDir,
      entry: {
        ...logEntryBase,
        deliveryStatus: "sent",
        delivery
      }
    });
  } catch (error) {
    await appendInquiryLog({
      rootDir,
      entry: {
        ...logEntryBase,
        deliveryStatus: "failed",
        error: String(error && error.message ? error.message : error)
      }
    });
    throw error;
  }

  return { ok: true, recipient };
};

module.exports = {
  sendContactInquiry
};
