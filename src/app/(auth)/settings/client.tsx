'use client';

/**
 * Settings Client Component
 *
 * Interactive settings page with language selector and preference toggles.
 *
 * UI/UX: Professional Corporate style with navy blue accents
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Separator } from '@/shared/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { LanguageSelectorFull } from '@/features/settings/components/language-selector';
import { useSettings } from '@/features/settings/hooks/use-settings';
import { TIMEZONE_OPTIONS, DEFAULT_USER_SETTINGS, type UserSettings } from '@/features/settings/types';
import { Globe, Bell, Eye, Clock, RotateCcw, Save } from 'lucide-react';

interface SettingsClientProps {
  initialSettings: UserSettings | null;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const { settings, updateSettings, resetSettings, isLoading } = useSettings();
  const [hasChanges, setHasChanges] = useState(false);

  // Use settings from hook or initial
  const currentSettings = settings || initialSettings || DEFAULT_USER_SETTINGS;
  const locale = currentSettings.locale || 'en';

  // Local state for form
  const [formData, setFormData] = useState({
    theme: currentSettings.theme || 'system',
    dateFormat: currentSettings.dateFormat || 'DD/MM/YYYY',
    timezone: currentSettings.timezone || 'Asia/Bangkok',
    emailNotifications: currentSettings.emailNotifications ?? true,
    smsNotifications: currentSettings.smsNotifications ?? false,
    teamsNotifications: currentSettings.teamsNotifications ?? true,
    reminderDaysBefore: currentSettings.reminderDaysBefore || 3,
    autoSaveInterval: currentSettings.autoSaveInterval || 30,
    compactMode: currentSettings.compactMode ?? false,
    showHelpTips: currentSettings.showHelpTips ?? true,
  });

  const handleFieldChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateSettings(formData);
    setHasChanges(false);
  };

  const handleReset = async () => {
    await resetSettings();
    setFormData({
      theme: DEFAULT_USER_SETTINGS.theme,
      dateFormat: DEFAULT_USER_SETTINGS.dateFormat,
      timezone: DEFAULT_USER_SETTINGS.timezone,
      emailNotifications: DEFAULT_USER_SETTINGS.emailNotifications,
      smsNotifications: DEFAULT_USER_SETTINGS.smsNotifications,
      teamsNotifications: DEFAULT_USER_SETTINGS.teamsNotifications,
      reminderDaysBefore: DEFAULT_USER_SETTINGS.reminderDaysBefore,
      autoSaveInterval: DEFAULT_USER_SETTINGS.autoSaveInterval,
      compactMode: DEFAULT_USER_SETTINGS.compactMode,
      showHelpTips: DEFAULT_USER_SETTINGS.showHelpTips,
    });
    setHasChanges(false);
  };

  const t = {
    title: locale === 'th' ? 'การตั้งค่า' : 'Settings',
    subtitle: locale === 'th' ? 'จัดการการตั้งค่าบัญชีและการแสดงผล' : 'Manage your account and display preferences',
    language: locale === 'th' ? 'ภาษา' : 'Language',
    languageDesc: locale === 'th' ? 'เลือกภาษาที่ต้องการใช้งาน' : 'Select your preferred display language',
    display: locale === 'th' ? 'การแสดงผล' : 'Display',
    displayDesc: locale === 'th' ? 'ปรับแต่งรูปแบบการแสดงผล' : 'Customize your display preferences',
    theme: locale === 'th' ? 'ธีม' : 'Theme',
    themeLight: locale === 'th' ? 'สว่าง' : 'Light',
    themeDark: locale === 'th' ? 'มืด' : 'Dark',
    themeSystem: locale === 'th' ? 'ตามระบบ' : 'System',
    dateFormat: locale === 'th' ? 'รูปแบบวันที่' : 'Date Format',
    timezone: locale === 'th' ? 'เขตเวลา' : 'Timezone',
    notifications: locale === 'th' ? 'การแจ้งเตือน' : 'Notifications',
    notificationsDesc: locale === 'th' ? 'จัดการช่องทางการแจ้งเตือน' : 'Manage notification channels',
    emailNotif: locale === 'th' ? 'อีเมล' : 'Email',
    smsNotif: locale === 'th' ? 'SMS' : 'SMS',
    teamsNotif: locale === 'th' ? 'Microsoft Teams' : 'Microsoft Teams',
    reminderDays: locale === 'th' ? 'แจ้งเตือนล่วงหน้า (วัน)' : 'Reminder Days Before',
    autosave: locale === 'th' ? 'บันทึกอัตโนมัติ (วินาที)' : 'Auto-save Interval (seconds)',
    compactMode: locale === 'th' ? 'โหมดกะทัดรัด' : 'Compact Mode',
    compactModeDesc: locale === 'th' ? 'แสดงข้อมูลแบบกระชับ' : 'Display more information in less space',
    helpTips: locale === 'th' ? 'แสดงคำแนะนำ' : 'Show Help Tips',
    helpTipsDesc: locale === 'th' ? 'แสดงคำแนะนำการใช้งาน' : 'Display contextual help tips',
    save: locale === 'th' ? 'บันทึก' : 'Save',
    reset: locale === 'th' ? 'รีเซ็ต' : 'Reset',
    resetToDefaults: locale === 'th' ? 'คืนค่าเริ่มต้น' : 'Reset to Defaults',
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-700">{t.title}</h1>
          <p className="text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={handleSave} className="bg-navy-600 hover:bg-navy-700">
              <Save className="h-4 w-4 mr-2" />
              {t.save}
            </Button>
          )}
          <Button variant="outline" onClick={handleReset} disabled={isLoading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t.resetToDefaults}
          </Button>
        </div>
      </div>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy-700">
            <Globe className="h-5 w-5" />
            {t.language}
          </CardTitle>
          <CardDescription>{t.languageDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSelectorFull />
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy-700">
            <Eye className="h-5 w-5" />
            {t.display}
          </CardTitle>
          <CardDescription>{t.displayDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div className="space-y-2">
            <Label>{t.theme}</Label>
            <Select
              value={formData.theme}
              onValueChange={(value) => handleFieldChange('theme', value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t.themeLight}</SelectItem>
                <SelectItem value="dark">{t.themeDark}</SelectItem>
                <SelectItem value="system">{t.themeSystem}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Format */}
          <div className="space-y-2">
            <Label>{t.dateFormat}</Label>
            <Select
              value={formData.dateFormat}
              onValueChange={(value) => handleFieldChange('dateFormat', value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label>{t.timezone}</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleFieldChange('timezone', value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Compact Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t.compactMode}</Label>
              <p className="text-sm text-slate-500">{t.compactModeDesc}</p>
            </div>
            <Switch
              checked={formData.compactMode}
              onCheckedChange={(checked) => handleFieldChange('compactMode', checked)}
            />
          </div>

          {/* Help Tips */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t.helpTips}</Label>
              <p className="text-sm text-slate-500">{t.helpTipsDesc}</p>
            </div>
            <Switch
              checked={formData.showHelpTips}
              onCheckedChange={(checked) => handleFieldChange('showHelpTips', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-navy-700">
            <Bell className="h-5 w-5" />
            {t.notifications}
          </CardTitle>
          <CardDescription>{t.notificationsDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-center justify-between">
            <Label>{t.emailNotif}</Label>
            <Switch
              checked={formData.emailNotifications}
              onCheckedChange={(checked) => handleFieldChange('emailNotifications', checked)}
            />
          </div>

          {/* SMS */}
          <div className="flex items-center justify-between">
            <Label>{t.smsNotif}</Label>
            <Switch
              checked={formData.smsNotifications}
              onCheckedChange={(checked) => handleFieldChange('smsNotifications', checked)}
            />
          </div>

          {/* Teams */}
          <div className="flex items-center justify-between">
            <Label>{t.teamsNotif}</Label>
            <Switch
              checked={formData.teamsNotifications}
              onCheckedChange={(checked) => handleFieldChange('teamsNotifications', checked)}
            />
          </div>

          <Separator />

          {/* Reminder Days */}
          <div className="space-y-2">
            <Label>{t.reminderDays}</Label>
            <Select
              value={String(formData.reminderDaysBefore)}
              onValueChange={(value) => handleFieldChange('reminderDaysBefore', parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 7, 10, 14].map((days) => (
                  <SelectItem key={days} value={String(days)}>
                    {days} {locale === 'th' ? 'วัน' : 'days'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auto-save Interval */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t.autosave}
            </Label>
            <Select
              value={String(formData.autoSaveInterval)}
              onValueChange={(value) => handleFieldChange('autoSaveInterval', parseInt(value))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 30, 45, 60, 90, 120].map((seconds) => (
                  <SelectItem key={seconds} value={String(seconds)}>
                    {seconds} {locale === 'th' ? 'วินาที' : 'seconds'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
