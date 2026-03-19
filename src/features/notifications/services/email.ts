import { prisma as db } from '@/shared/lib/db';
import { logger } from '@/shared/lib/logger';
import type { NotificationServiceResult } from '../types';

interface SendEmailInput {
  to?: string;
  userId: string;
  subject: string;
  message: string;
  htmlMessage?: string;
}

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

// Get email configuration from environment
function getEmailConfig(): EmailConfig {
  return {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.SMTP_FROM || 'noreply@company.com',
  };
}

/**
 * Send email notification
 * This implementation uses a mock for development and can be connected to a real SMTP service
 */
export async function sendEmail(input: SendEmailInput): Promise<NotificationServiceResult> {
  const { userId, subject, message, htmlMessage } = input;

  try {
    // Get user email from database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      return {
        success: false,
        error: `User not found: ${userId}`,
      };
    }

    const to = input.to || user.email;
    const config = getEmailConfig();

    // In development/test mode, log instead of sending
    if (process.env.NODE_ENV !== 'production' || !config.host || config.host === 'localhost') {
      logger.info({
        to,
        subject,
        messageLength: message.length,
      }, '[EmailService] Development mode - logging email instead of sending');

      console.log(`
═══════════════════════════════════════════════════════════════
EMAIL NOTIFICATION (Development Mode)
═══════════════════════════════════════════════════════════════
To: ${to}
From: ${config.from}
Subject: ${subject}
───────────────────────────────────────────────────────────────
${message}
═══════════════════════════════════════════════════════════════
      `);

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    }

    // Production: Use nodemailer or similar SMTP client
    // This is a placeholder for actual SMTP implementation
    // In production, you would:
    // 1. Import nodemailer
    // 2. Create transporter with config
    // 3. Send mail

    /*
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    const result = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text: message,
      html: htmlMessage || message.replace(/\n/g, '<br>'),
    });

    return {
      success: true,
      messageId: result.messageId,
    };
    */

    // For now, simulate successful send in production without actual SMTP
    logger.info({
      to,
      from: config.from,
      subject,
    }, '[EmailService] Email would be sent');

    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({
      userId,
      error: errorMessage,
    }, '[EmailService] Failed to send email');

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Generate HTML email template
 */
export function generateEmailHtml(
  subject: string,
  message: string,
  options?: {
    recipientName?: string;
    actionUrl?: string;
    actionText?: string;
  }
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1e3a5f;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: #1e3a5f;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f8fafc;
      padding: 30px;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e2e8f0;
      border-top: none;
    }
    .message {
      white-space: pre-wrap;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      background: #1e3a5f;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 12px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Performance Metrics Portal</h1>
  </div>
  <div class="content">
    ${options?.recipientName ? `<p>Dear ${options.recipientName},</p>` : ''}
    <div class="message">${message.replace(/\n/g, '<br>')}</div>
    ${options?.actionUrl && options?.actionText
      ? `<a href="${options.actionUrl}" class="button">${options.actionText}</a>`
      : ''
    }
  </div>
  <div class="footer">
    <p>This is an automated message from the Performance Metrics Portal.</p>
    <p>Please do not reply to this email.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send notification email with template
 */
export async function sendTemplatedEmail(
  input: SendEmailInput & {
    recipientName?: string;
    actionUrl?: string;
    actionText?: string;
  }
): Promise<NotificationServiceResult> {
  const htmlMessage = generateEmailHtml(
    input.subject,
    input.message,
    {
      recipientName: input.recipientName,
      actionUrl: input.actionUrl,
      actionText: input.actionText,
    }
  );

  return sendEmail({
    ...input,
    htmlMessage,
  });
}
