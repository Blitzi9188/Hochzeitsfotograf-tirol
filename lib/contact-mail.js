const fs = require("fs/promises");
const path = require("path");
const dns = require("dns/promises");
const nodemailer = require("nodemailer");
const { Resend } = require("resend");

const getSiteSettings = async (rootDir) => {
  const filePath = path.join(rootDir, "content", "settings", "site.json");
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
};

const pickFirstNonEmpty = (...values) =>
  values
    .map((value) => String(value || "").trim())
    .find(Boolean) || "";

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

  return null;
};

const resolveContactRecipient = ({ siteSettings, transportType }) => {
  if (transportType === "resend") {
    return pickFirstNonEmpty(
      process.env.RESEND_TO,
      process.env.MAIL_TO,
      process.env.SMTP_TO,
      siteSettings.contactFormRecipient,
      siteSettings.contactDirectMail,
      siteSettings.email
    );
  }

  return pickFirstNonEmpty(
    process.env.SMTP_TO,
    process.env.MAIL_TO,
    process.env.RESEND_TO,
    siteSettings.contactFormRecipient,
    siteSettings.contactDirectMail,
    siteSettings.email
  );
};

const getRecipientDomain = (email) => String(email || "").trim().split("@")[1]?.toLowerCase() || "";

const shouldAttemptDirectMxDelivery = (recipient) => {
  const domain = getRecipientDomain(recipient);
  return domain === "blitzkneisser.com";
};

const sendDirectToRecipientMx = async ({ to, subject, html, text, replyTo, from }) => {
  const domain = getRecipientDomain(to);
  if (!domain) {
    throw new Error("Missing recipient domain for direct MX delivery");
  }

  const mxRecords = await dns.resolveMx(domain);
  if (!Array.isArray(mxRecords) || !mxRecords.length) {
    throw new Error(`No MX records found for ${domain}`);
  }

  const mxHost = [...mxRecords]
    .sort((a, b) => Number(a.priority || 0) - Number(b.priority || 0))
    .map((record) => String(record.exchange || "").replace(/\.$/, ""))
    .find(Boolean);

  if (!mxHost) {
    throw new Error(`No usable MX host found for ${domain}`);
  }

  const transporter = nodemailer.createTransport({
    host: mxHost,
    port: 25,
    secure: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false
    }
  });

  const normalizedReplyTo = String(replyTo || "").trim() || undefined;
  const safeFrom = String(from || to).trim() || to;
  const result = await transporter.sendMail({
    from: safeFrom,
    to,
    replyTo: normalizedReplyTo,
    subject,
    html,
    text
  });

  return {
    provider: "direct-mx",
    sender: safeFrom,
    host: mxHost,
    messageId: result?.messageId || null,
    response: result?.response || null,
    accepted: Array.isArray(result?.accepted) ? result.accepted : [],
    rejected: Array.isArray(result?.rejected) ? result.rejected : []
  };
};

const sendMail = async ({ to, subject, html, text, replyTo }) => {
  const transport = resolveMailTransport();
  const normalizedReplyTo = String(replyTo || "").trim() || undefined;
  const deliveries = [];
  let primaryError = null;

  if (transport) {
    if (!transport.from) {
      throw new Error("Missing sender address. Configure RESEND_FROM or SMTP_FROM");
    }

    try {
      if (transport.type === "resend") {
        const result = await transport.client.emails.send({
          from: transport.from,
          to,
          replyTo: normalizedReplyTo,
          subject,
          html,
          text
        });
        deliveries.push({
          provider: "resend",
          sender: transport.from,
          messageId: result?.data?.id || result?.id || null,
          response: "accepted"
        });
      } else {
        const result = await transport.client.sendMail({
          from: transport.from,
          to,
          replyTo: normalizedReplyTo,
          subject,
          html,
          text
        });

        deliveries.push({
          provider: "smtp",
          sender: transport.from,
          messageId: result?.messageId || null,
          response: result?.response || null,
          accepted: Array.isArray(result?.accepted) ? result.accepted : [],
          rejected: Array.isArray(result?.rejected) ? result.rejected : []
        });
      }
    } catch (error) {
      primaryError = error;
    }
  }

  if (shouldAttemptDirectMxDelivery(to)) {
    try {
      const directResult = await sendDirectToRecipientMx({
        to,
        replyTo: normalizedReplyTo,
        subject,
        html,
        text,
        from: (transport && transport.from) || to
      });
      deliveries.push(directResult);
    } catch (error) {
      if (!deliveries.length) {
        primaryError = error;
      } else {
        deliveries.push({
          provider: "direct-mx",
          error: String(error && error.message ? error.message : error)
        });
      }
    }
  }

  if (!deliveries.length) {
    throw primaryError || new Error("Missing RESEND_API_KEY or SMTP_* configuration");
  }

  return {
    provider: deliveries[0].provider,
    sender: deliveries[0].sender || "",
    messageId: deliveries[0].messageId || null,
    response: deliveries[0].response || null,
    accepted: deliveries[0].accepted || [],
    rejected: deliveries[0].rejected || [],
    deliveries
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
  const transport = resolveMailTransport();
  const recipient = resolveContactRecipient({
    siteSettings,
    transportType: transport?.type || ""
  });

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

  const subjectDate = date || (lang === "en" ? "Preferred date open" : "Wunschdatum offen");
  const subject = [
    lang === "en" ? "Your wedding" : "Eure Hochzeit",
    subjectDate
  ].join(" | ");

  const details = [
    [lang === "en" ? "Source" : "Quelle", source],
    [lang === "en" ? "Name" : "Name", name],
    [lang === "en" ? "Email" : "E-Mail", email],
    [lang === "en" ? "Preferred date" : "Wunschdatum", date],
    [lang === "en" ? "Location" : "Ort", location],
    [lang === "en" ? "How they found me" : "Wie sie mich gefunden haben", referral]
  ].filter(([, value]) => String(value || "").trim());

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
