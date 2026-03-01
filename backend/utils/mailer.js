const nodemailer = require('nodemailer');

const parseSecure = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'ssl';
};

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = parseSecure(process.env.SMTP_SECURE);
  const connectionTimeout = Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000);
  const greetingTimeout = Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000);
  const socketTimeout = Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000);

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout,
    greetingTimeout,
    socketTimeout
  });
};

const sendMail = async ({ to, subject, html, attachments = [] }) => {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@bharatbasket.com';

  if (!to) return { delivered: false, reason: 'missing_recipient' };
  if (!transporter) return { delivered: false, reason: 'smtp_not_configured' };

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments
    });
    return { delivered: true };
  } catch (error) {
    return { delivered: false, reason: error.message };
  }
};

module.exports = { sendMail };
