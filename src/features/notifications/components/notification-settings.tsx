'use client';

import { useState } from 'react';
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Separator } from '@/shared/components/ui/separator';
import { Checkbox } from '@/shared/components/ui/checkbox';
import type { NotificationPreferences } from '../types';

interface NotificationSettingsProps {
  initialPreferences?: Partial<NotificationPreferences>;
  onSave?: (preferences: NotificationPreferences) => Promise<void>;
  className?: string;
}

const defaultPreferences: NotificationPreferences = {
  userId: '',
  emailEnabled: true,
  smsEnabled: false,
  teamsEnabled: true,
  cycleStartNotifications: true,
  deadlineReminders: true,
  submissionConfirmations: true,
  feedbackNotifications: true,
  reminderDaysBefore: 3,
};

export function NotificationSettings({
  initialPreferences = {},
  onSave,
  className,
}: NotificationSettingsProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...defaultPreferences,
    ...initialPreferences,
  });
  const [isSaving, setIsSaving] = useState(false);

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(preferences);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save notification preferences.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#1e3a5f]">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure how and when you receive notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[#1e3a5f]">Notification Channels</h4>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email-enabled" className="cursor-pointer">
                Email notifications
              </Label>
            </div>
            <Checkbox
              id="email-enabled"
              checked={preferences.emailEnabled}
              onCheckedChange={(checked: boolean) => updatePreference('emailEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sms-enabled" className="cursor-pointer">
                SMS notifications
              </Label>
            </div>
            <Checkbox
              id="sms-enabled"
              checked={preferences.smsEnabled}
              onCheckedChange={(checked: boolean) => updatePreference('smsEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="teams-enabled" className="cursor-pointer">
                Microsoft Teams
              </Label>
            </div>
            <Checkbox
              id="teams-enabled"
              checked={preferences.teamsEnabled}
              onCheckedChange={(checked: boolean) => updatePreference('teamsEnabled', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[#1e3a5f]">Notification Types</h4>

          <div className="flex items-center justify-between">
            <Label htmlFor="cycle-start" className="cursor-pointer">
              Review cycle start notifications
            </Label>
            <Checkbox
              id="cycle-start"
              checked={preferences.cycleStartNotifications}
              onCheckedChange={(checked: boolean) => updatePreference('cycleStartNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="deadline-reminders" className="cursor-pointer">
              Deadline reminders
            </Label>
            <Checkbox
              id="deadline-reminders"
              checked={preferences.deadlineReminders}
              onCheckedChange={(checked: boolean) => updatePreference('deadlineReminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="submission-confirm" className="cursor-pointer">
              Submission confirmations
            </Label>
            <Checkbox
              id="submission-confirm"
              checked={preferences.submissionConfirmations}
              onCheckedChange={(checked: boolean) => updatePreference('submissionConfirmations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="feedback-notif" className="cursor-pointer">
              Feedback notifications
            </Label>
            <Checkbox
              id="feedback-notif"
              checked={preferences.feedbackNotifications}
              onCheckedChange={(checked: boolean) => updatePreference('feedbackNotifications', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Reminder Timing */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[#1e3a5f]">Reminder Timing</h4>

          <div className="flex items-center justify-between">
            <Label>Send deadline reminders</Label>
            <select
              value={preferences.reminderDaysBefore}
              onChange={(e) => updatePreference('reminderDaysBefore', Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={1}>1 day before</option>
              <option value={2}>2 days before</option>
              <option value={3}>3 days before</option>
              <option value={5}>5 days before</option>
              <option value={7}>1 week before</option>
              <option value={14}>2 weeks before</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        {onSave && (
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
