import { prisma as db } from '@/shared/lib/db';
import { logger } from '@/shared/lib/logger';
import type { NotificationServiceResult } from '../types';

interface SendTeamsInput {
  userId: string;
  message: string;
  title?: string;
  cardData?: TeamsAdaptiveCard;
}

interface TeamsConfig {
  webhookUrl: string;
  enabled: boolean;
}

interface TeamsAdaptiveCard {
  type: 'AdaptiveCard';
  version: string;
  body: TeamsCardElement[];
  actions?: TeamsCardAction[];
}

interface TeamsCardElement {
  type: string;
  text?: string;
  size?: string;
  weight?: string;
  color?: string;
  wrap?: boolean;
  spacing?: string;
  facts?: Array<{ title: string; value: string }>;
}

interface TeamsCardAction {
  type: string;
  title: string;
  url: string;
}

function getTeamsConfig(): TeamsConfig {
  return {
    webhookUrl: process.env.TEAMS_WEBHOOK_URL || '',
    enabled: process.env.TEAMS_NOTIFICATIONS_ENABLED === 'true',
  };
}

export async function sendTeamsMessage(input: SendTeamsInput): Promise<NotificationServiceResult> {
  const { userId, message, title, cardData } = input;

  try {
    const config = getTeamsConfig();

    if (!config.enabled || !config.webhookUrl) {
      logger.info({
        userId,
        enabled: config.enabled,
      }, '[TeamsService] Teams notifications disabled or not configured');

      if (process.env.NODE_ENV !== 'production') {
        console.log(`
═══════════════════════════════════════════════════════════════
TEAMS NOTIFICATION (Development Mode)
═══════════════════════════════════════════════════════════════
User ID: ${userId}
Title: ${title || 'Notification'}
───────────────────────────────────────────────────────────────
${message}
═══════════════════════════════════════════════════════════════
        `);
      }

      return {
        success: true,
        messageId: `dev-teams-${Date.now()}`,
      };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const card = cardData || buildDefaultCard(
      title || 'Performance Metrics Portal',
      message,
      user?.name
    );

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            contentUrl: null,
            content: card,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Teams webhook failed: ${response.status} - ${errorText}`);
    }

    logger.info({
      userId,
      title: title || 'Notification',
    }, '[TeamsService] Teams message sent successfully');

    return {
      success: true,
      messageId: `teams-${Date.now()}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error({
      userId,
      error: errorMessage,
    }, '[TeamsService] Failed to send Teams message');

    return {
      success: false,
      error: errorMessage,
    };
  }
}

function buildDefaultCard(
  title: string,
  message: string,
  recipientName?: string
): TeamsAdaptiveCard {
  const body: TeamsCardElement[] = [
    {
      type: 'TextBlock',
      text: title,
      size: 'Large',
      weight: 'Bolder',
      color: 'Accent',
    },
  ];

  if (recipientName) {
    body.push({
      type: 'TextBlock',
      text: `Hello, ${recipientName}`,
      size: 'Medium',
      weight: 'Bolder',
      wrap: true,
      spacing: 'Medium',
    });
  }

  body.push({
    type: 'TextBlock',
    text: message,
    size: 'Medium',
    wrap: true,
    spacing: 'Small',
  });

  return {
    type: 'AdaptiveCard',
    version: '1.4',
    body,
  };
}

export function buildActionCard(
  title: string,
  message: string,
  actionUrl: string,
  actionText: string = 'View Details',
  recipientName?: string
): TeamsAdaptiveCard {
  const body: TeamsCardElement[] = [
    {
      type: 'TextBlock',
      text: title,
      size: 'Large',
      weight: 'Bolder',
      color: 'Accent',
    },
  ];

  if (recipientName) {
    body.push({
      type: 'TextBlock',
      text: `Hello, ${recipientName}`,
      size: 'Medium',
      weight: 'Bolder',
      wrap: true,
      spacing: 'Medium',
    });
  }

  body.push({
    type: 'TextBlock',
    text: message,
    size: 'Medium',
    wrap: true,
    spacing: 'Small',
  });

  return {
    type: 'AdaptiveCard',
    version: '1.4',
    body,
    actions: [
      {
        type: 'Action.OpenUrl',
        title: actionText,
        url: actionUrl,
      },
    ],
  };
}

export function buildDeadlineCard(
  title: string,
  message: string,
  deadline: string,
  actionUrl: string,
  recipientName?: string
): TeamsAdaptiveCard {
  const body: TeamsCardElement[] = [
    {
      type: 'TextBlock',
      text: `⏰ ${title}`,
      size: 'Large',
      weight: 'Bolder',
      color: 'Warning',
    },
    {
      type: 'TextBlock',
      text: message,
      size: 'Medium',
      wrap: true,
      spacing: 'Medium',
    },
    {
      type: 'FactSet',
      spacing: 'Medium',
      facts: [
        {
          title: 'Deadline:',
          value: deadline,
        },
      ],
    },
  ];

  return {
    type: 'AdaptiveCard',
    version: '1.4',
    body,
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'Complete Now',
        url: actionUrl,
      },
    ],
  };
}

export async function sendTeamsCard(
  userId: string,
  card: TeamsAdaptiveCard
): Promise<NotificationServiceResult> {
  return sendTeamsMessage({
    userId,
    message: '',
    cardData: card,
  });
}
