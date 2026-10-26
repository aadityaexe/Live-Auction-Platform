import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import config from "../config/env.js";
import { logger } from "../logger/logger.js";

let transporter: Transporter | null = null;

const isSmtpConfigured = (): boolean => {
  return Boolean(config.SMTP_HOST && config.SMTP_USER && config.SMTP_PASSWORD);
};

const getTransporter = (): Transporter => {
  if (transporter) return transporter;

  if (isSmtpConfigured()) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      requireTLS: config.SMTP_PORT === 587,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 10000,
    });
    logger.info("SMTP transporter ready: " + config.SMTP_HOST + ":" + config.SMTP_PORT);
  } else {
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    logger.warn("SMTP not configured — emails will be logged only");
  }

  return transporter;
};

export const verifyTransporter = async (): Promise<void> => {
  if (!isSmtpConfigured()) return;
  try {
    await getTransporter().verify();
    logger.info("SMTP connection verified successfully");
  } catch (err: any) {
    logger.error("SMTP verify failed", {
      code: err.code,
      response: err.response,
      command: err.command,
    });
  }
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  const mailClient = getTransporter();
  // from must be the authenticated Gmail address — using a fake domain causes rejection
  const from = isSmtpConfigured() ? config.SMTP_USER : "noreply@auction.local";

  try {
    const info = await mailClient.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text || options.subject,
      html: options.html,
    });

    if (!isSmtpConfigured()) {
      logger.info(`[Email Simulation] to=${options.to} subject=${options.subject}`);
    } else {
      logger.info(`Email sent to ${options.to} (${info.messageId})`);
    }

    return true;
  } catch (err: any) {
    logger.error("sendMail failed", {
      to: options.to,
      code: err.code,
      response: err.response,
      command: err.command,
    });
    return false;
  }
};

const getBaseEmailTemplate = (title: string, contentHtml: string): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0c10;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #0b0c10;
      padding: 40px 16px;
    }
    .card {
      max-width: 520px;
      margin: 0 auto;
      background-color: #12151c;
      border: 1px solid #232936;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 32px 32px 24px;
      border-bottom: 1px solid #1e2430;
      text-align: center;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #d4af37;
      margin: 0;
    }
    .brand-subtitle {
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #718096;
      margin-top: 6px;
    }
    .content {
      padding: 36px 32px;
      line-height: 1.6;
    }
    .otp-container {
      margin: 28px 0;
      text-align: center;
    }
    .otp-code {
      display: inline-block;
      font-family: 'Courier New', Courier, monospace;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 0.35em;
      padding: 16px 28px;
      background-color: #1a202c;
      border: 1px solid #d4af37;
      border-radius: 6px;
      color: #f7fafc;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.4);
    }
    .footer {
      padding: 24px 32px;
      border-top: 1px solid #1e2430;
      background-color: #0e1117;
      text-align: center;
      font-size: 12px;
      color: #718096;
    }
    .notice {
      background-color: #181d28;
      border-left: 3px solid #d4af37;
      padding: 12px 16px;
      margin-top: 24px;
      font-size: 13px;
      color: #a0aec0;
      border-radius: 0 4px 4px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="brand-title">Sotheby's Digital</div>
        <div class="brand-subtitle">Real-Time Live Auctions</div>
      </div>
      <div class="content">
        ${contentHtml}
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px;">&copy; ${new Date().getFullYear()} Sotheby's Digital Auction House. All rights reserved.</p>
        <p style="margin: 0;">This is an automated security transmission. Please do not reply directly to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

export const sendVerificationEmail = async (
  email: string,
  otp: string,
  username?: string
): Promise<boolean> => {
  const greeting = username ? `Dear ${username},` : "Hello,";
  const content = `
    <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 16px;">Verify Your Email Address</h2>
    <p style="margin-bottom: 16px; color: #cbd5e1;">${greeting}</p>
    <p style="margin-bottom: 20px; color: #cbd5e1;">
      Thank you for registering with Sotheby's Digital. To ensure the highest level of trust and integrity across our live auctions, please verify your email address using the one-time code below:
    </p>
    
    <div class="otp-container">
      <div class="otp-code">${otp}</div>
    </div>

    <div class="notice">
      <strong>Important:</strong> This one-time password (OTP) is strictly valid for <strong>10 minutes</strong>. Never disclose this code to anyone.
    </div>

    <p style="margin-top: 24px; font-size: 13px; color: #94a3b8;">
      If you did not request this verification, please safely disregard this email or contact security if you have concerns.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `[Sotheby's Digital] ${otp} is your Email Verification Code`,
    text: `Your Sotheby's Digital email verification code is: ${otp}. It expires in 10 minutes.`,
    html: getBaseEmailTemplate("Verify Your Email Address", content),
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  otp: string,
  username?: string
): Promise<boolean> => {
  const greeting = username ? `Dear ${username},` : "Hello,";
  const content = `
    <h2 style="font-size: 20px; font-weight: 600; color: #ffffff; margin-top: 0; margin-bottom: 16px;">Password Reset Request</h2>
    <p style="margin-bottom: 16px; color: #cbd5e1;">${greeting}</p>
    <p style="margin-bottom: 20px; color: #cbd5e1;">
      We received a request to reset the password for your Sotheby's Digital auction account. Use the authorization code below to proceed:
    </p>
    
    <div class="otp-container">
      <div class="otp-code">${otp}</div>
    </div>

    <div class="notice">
      <strong>Security Notice:</strong> This reset code will expire in <strong>10 minutes</strong>. If you did not make this request, someone may be attempting to access your account. Your password remains unchanged until this code is submitted.
    </div>

    <p style="margin-top: 24px; font-size: 13px; color: #94a3b8;">
      For your security, our support staff will never ask for your password or verification codes.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `[Sotheby's Digital] ${otp} is your Password Reset Code`,
    text: `Your Sotheby's Digital password reset code is: ${otp}. It expires in 10 minutes.`,
    html: getBaseEmailTemplate("Password Reset Request", content),
  });
};

export const sendPasswordResetSuccessEmail = async (
  email: string,
  username?: string
): Promise<boolean> => {
  const greeting = username ? `Dear ${username},` : "Hello,";
  const content = `
    <h2 style="font-size: 20px; font-weight: 600; color: #10b981; margin-top: 0; margin-bottom: 16px;">Password Successfully Changed</h2>
    <p style="margin-bottom: 16px; color: #cbd5e1;">${greeting}</p>
    <p style="margin-bottom: 20px; color: #cbd5e1;">
      The password for your Sotheby's Digital auction account was recently updated. You can now use your new password to sign in.
    </p>

    <div class="notice" style="border-left-color: #ef4444;">
      If you did not perform this action, please contact our support team immediately to secure your account.
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `[Sotheby's Digital] Your Password Has Been Updated`,
    text: `Your Sotheby's Digital account password has been successfully reset.`,
    html: getBaseEmailTemplate("Password Changed", content),
  });
};
