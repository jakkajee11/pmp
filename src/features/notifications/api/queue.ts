import { Notification, NotificationQueueItem, notificationQueueItemSchema } from '../types';
import { sendEmail } from '../services/email';
import { sendSms } from '../services/sms';
import { sendTeamsMessage } from '../services/teams';
import { prisma as db } from '@/shared/lib/db';

// In-memory notification queue with retry logic
// Note: This is a simple in-memory implementation suitable for single-instance deployments
// For multi-instance deployments, consider using Redis or a proper message queue

class NotificationQueue {
  private queue: Map<string, NotificationQueueItem> = new Map();
  private processing: boolean = false;
  private maxRetries: number = 3;
  private retryDelays: number[] = [60000, 300000, 900000]; // 1min, 5min, 15min
  private processInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start processing loop
    this.startProcessing();
  }

  /**
   * Add notification to the queue
   */
  async enqueue(notification: Notification, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
    const item: NotificationQueueItem = notificationQueueItemSchema.parse({
      id: notification.id,
      notification,
      attempts: 0,
      nextRetryAt: new Date(),
      priority,
    });

    this.queue.set(notification.id, item);
    console.log(`[NotificationQueue] Enqueued notification ${notification.id} with priority ${priority}`);
  }

  /**
   * Remove notification from queue
   */
  dequeue(id: string): NotificationQueueItem | undefined {
    const item = this.queue.get(id);
    if (item) {
      this.queue.delete(id);
    }
    return item;
  }

  /**
   * Get queue size
   */
  get size(): number {
    return this.queue.size;
  }

  /**
   * Get pending items count
   */
  get pendingCount(): number {
    let count = 0;
    for (const item of this.queue.values()) {
      if (item.notification.status === 'pending') {
        count++;
      }
    }
    return count;
  }

  /**
   * Start the processing loop
   */
  private startProcessing(): void {
    // Process queue every 10 seconds
    this.processInterval = setInterval(() => {
      this.processQueue().catch((error) => {
        console.error('[NotificationQueue] Error processing queue:', error);
      });
    }, 10000);
  }

  /**
   * Stop the processing loop
   */
  stopProcessing(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Process all due notifications
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    const now = new Date();

    try {
      // Get items due for processing, sorted by priority
      const dueItems = Array.from(this.queue.values())
        .filter((item) => item.nextRetryAt <= now && item.notification.status === 'pending')
        .sort((a, b) => {
          const priorityOrder = { high: 0, normal: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

      // Process each item
      for (const item of dueItems) {
        await this.processItem(item);
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single notification
   */
  private async processItem(item: NotificationQueueItem): Promise<void> {
    const { notification } = item;
    console.log(`[NotificationQueue] Processing notification ${notification.id} (attempt ${item.attempts + 1})`);

    try {
      let result;

      switch (notification.channel) {
        case 'email':
          result = await sendEmail({
            to: '', // Will be resolved from userId in the service
            subject: notification.subject,
            message: notification.message,
            userId: notification.userId,
          });
          break;

        case 'sms':
          result = await sendSms({
            to: '', // Will be resolved from userId in the service
            message: notification.message,
            userId: notification.userId,
          });
          break;

        case 'teams':
          result = await sendTeamsMessage({
            message: notification.message,
            userId: notification.userId,
          });
          break;

        default:
          throw new Error(`Unknown notification channel: ${notification.channel}`);
      }

      if (result.success) {
        // Mark as sent
        await this.markAsSent(notification.id);
        this.queue.delete(notification.id);
        console.log(`[NotificationQueue] Successfully sent notification ${notification.id}`);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[NotificationQueue] Failed to send notification ${notification.id}:`, errorMessage);

      // Increment attempt counter
      item.attempts += 1;

      if (item.attempts >= this.maxRetries) {
        // Max retries reached, mark as failed
        await this.markAsFailed(notification.id, errorMessage);
        this.queue.delete(notification.id);
        console.log(`[NotificationQueue] Max retries reached for notification ${notification.id}`);
      } else {
        // Schedule retry with exponential backoff
        item.nextRetryAt = new Date(Date.now() + this.retryDelays[item.attempts - 1]);
        this.queue.set(notification.id, item);
        console.log(`[NotificationQueue] Scheduled retry for notification ${notification.id} at ${item.nextRetryAt.toISOString()}`);
      }
    }
  }

  /**
   * Mark notification as sent in database
   */
  private async markAsSent(id: string): Promise<void> {
    await db.notification.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    });
  }

  /**
   * Mark notification as failed in database
   */
  private async markAsFailed(id: string, errorMessage: string): Promise<void> {
    await db.notification.update({
      where: { id },
      data: {
        status: 'failed',
        errorMessage,
      },
    });
  }

  /**
   * Manually trigger processing (for testing)
   */
  async processNow(): Promise<void> {
    await this.processQueue();
  }

  /**
   * Get queue status for monitoring
   */
  getStatus(): {
    queueSize: number;
    pendingCount: number;
    processing: boolean;
  } {
    return {
      queueSize: this.queue.size,
      pendingCount: this.pendingCount,
      processing: this.processing,
    };
  }

  /**
   * Load pending notifications from database on startup
   */
  async loadPendingFromDatabase(): Promise<void> {
    const pendingNotifications = await db.notification.findMany({
      where: {
        status: 'pending',
        retryCount: { lt: this.maxRetries },
      },
    });

    for (const notification of pendingNotifications) {
      const parsed = notificationQueueItemSchema.parse({
        id: notification.id,
        notification,
        attempts: notification.retryCount,
        nextRetryAt: new Date(),
        priority: 'normal',
      });
      this.queue.set(notification.id, parsed);
    }

    console.log(`[NotificationQueue] Loaded ${pendingNotifications.length} pending notifications from database`);
  }
}

// Export singleton instance
export const notificationQueue = new NotificationQueue();

// Graceful shutdown handler
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    notificationQueue.stopProcessing();
  });

  process.on('SIGINT', () => {
    notificationQueue.stopProcessing();
  });
}
