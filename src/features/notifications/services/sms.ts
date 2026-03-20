import { prisma as db } from '@/shared/lib/db';
import { logger } from '@/shared/lib/logger';
import type { NotificationServiceResult } from '../types';

interface SendSmsInput {
  to?: string;
  userId: string;
  message: string;
}

interface SmsConfig {
  webhookUrl: string;
  apiKey: string;
  senderId: string;
}

// Get SMS configuration from environment
function getSmsConfig(): SmsConfig {
  return {
    webhookUrl: process.env.SMS_WEBHOOK_URL || '',
    apiKey: process.env.SMS_API_KEY || '',
    senderId: process.env.SMS_SENDER_ID || 'PMP',
  };
}

// Maximum message length for SMS (GSM-7 encoding)
const MAX_SMS_LENGTH = 160;

/**
 * Send SMS notification
 * This implementation uses a webhook-based SMS gateway
 */
export async function sendSms(input: SendSmsInput): Promise<NotificationServiceResult> {
  const { userId, message } = input;

  try {
    // Get user phone from database
    // Note: Phone number field would need to be added to User model
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        // phone: true, // Uncomment if phone field is added
      },
    });

    if (!user) {
      return {
        success: false,
        error: `User not found: ${userId}`,
      };
    }

    // For now, we don't have phone numbers in the system
    // This is a placeholder for when phone field is added
    const to = input.to || ''; // user.phone

    if (!to) {
      return {
        success: false,
        error: 'No phone number available for user',
      };
    }

    const config = getSmsConfig();

    // Truncate message if too long
    const truncatedMessage = message.length > MAX_SMS_LENGTH
      ? message.substring(0, MAX_SMS_LENGTH - 3) + '...'
      : message;

    // In development/test mode, log instead of sending
    if (process.env.NODE_ENV !== 'production' || !config.webhookUrl) {
      logger.info({
        to,
        messageLength: truncatedMessage.length,
      }, '[SmsService] Development mode - logging SMS instead of sending');

      console.log(`
═══════════════════════════════════════════════════════════════
SMS NOTIFICATION (Development Mode)
═══════════════════════════════════════════════════════════════
To: ${to}
From: ${config.senderId}
───────────────────────────────────────────────────────────────
${truncatedMessage}
═══════════════════════════════════════════════════════════════
      `);

      return {
        success: true,
        messageId: `dev-sms-${Date.now()}`,
      };
    }

    // Production: Send via SMS webhook
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        to: formatPhoneNumber(to),
        from: config.senderId,
        message: truncatedMessage,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SMS webhook failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    logger.info({
      to: maskPhoneNumber(to),
      messageId: result.id || result.messageId,
    }, '[SmsService] SMS sent successfully');

    return {
      success: true,
      messageId: result.id || result.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({
      userId,
      error: errorMessage,
    }, '[SmsService] Failed to send SMS');

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Format phone number for SMS gateway
 * Assumes Thai phone numbers, converts to international format
 */
function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');

  // If starts with 0, replace with +66
  if (digits.startsWith('0')) {
    return `+66${digits.substring(1)}`;
  }

  // If already has country code, just add +
  if (digits.startsWith('66')) {
    return `+${digits}`;
  }

  // Return as-is with + prefix
  return `+${digits}`;
}

/**
 * Mask phone number for logging (privacy)
 */
function maskPhoneNumber(phone: string): string {
  if (phone.length < 8) return phone;
  const start = phone.substring(0, 4);
  const end = phone.substring(phone.length - 2);
  return `${start}****${end}`;
}

/**
 * Send SMS to multiple recipients
 */
export async function sendBulkSms(
  inputs: SendSmsInput[]
): Promise<NotificationServiceResult[]> {
  const results: NotificationServiceResult[] = [];

  for (const input of inputs) {
    const result = await sendSms(input);
    results.push(result);

    // Small delay between sends to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return results;
}
