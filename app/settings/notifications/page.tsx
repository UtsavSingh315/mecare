"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Bell, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { useNotifications } from "@/contexts/notifications-context";
import Link from "next/link";
import { toast } from "sonner";
import { pushService } from "@/lib/notifications/push";

interface ReminderSetting {
  id: string;
  type: string;
  isEnabled: boolean;
  time: string | null;
  frequency: string | null;
  message: string | null;
}

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ReminderSetting[]>([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isAndroid, setIsAndroid] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  const defaultSettings = [
    {
      type: "period",
      label: "Period Reminders",
      description: "Get notified before your period is expected to start",
      defaultEnabled: true,
      hasTime: false,
      hasFrequency: false,
    },
    {
      type: "log",
      label: "Daily Log Reminders",
      description: "Reminder to log your daily symptoms and mood",
      defaultEnabled: true,
      hasTime: true,
      hasFrequency: true,
    },
    {
      type: "medication",
      label: "Medication Reminders",
      description: "Reminders for pills, supplements, or other medications",
      defaultEnabled: false,
      hasTime: true,
      hasFrequency: true,
    },
    {
      type: "insight",
      label: "Cycle Insights",
      description: "Get notifications about patterns and insights from your data",
      defaultEnabled: true,
      hasTime: false,
      hasFrequency: false,
    },
    {
      type: "achievement",
      label: "Achievements",
      description: "Celebrations for logging streaks and milestones",
      defaultEnabled: true,
      hasTime: false,
      hasFrequency: false,
    },
  ];

  useEffect(() => {
    if (user) {
      fetchSettings();
      checkPushSupport();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/users/${user.id}/reminder-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Merge with default settings to ensure all types are present
        const mergedSettings = defaultSettings.map(defaultSetting => {
          const existingSetting = data.find((s: ReminderSetting) => s.type === defaultSetting.type);
          
          if (existingSetting) {
            return existingSetting;
          } else {
            return {
              id: `new-${defaultSetting.type}`,
              type: defaultSetting.type,
              isEnabled: defaultSetting.defaultEnabled,
              time: defaultSetting.hasTime ? "20:00:00" : null,
              frequency: defaultSetting.hasFrequency ? "daily" : null,
              message: null,
            };
          }
        });
        
        setSettings(mergedSettings);
      } else {
        throw new Error("Failed to fetch settings");
      }
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      toast.error("Failed to load notification settings");
      
      // Use default settings if fetch fails
      const defaultMerged = defaultSettings.map(defaultSetting => ({
        id: `new-${defaultSetting.type}`,
        type: defaultSetting.type,
        isEnabled: defaultSetting.defaultEnabled,
        time: defaultSetting.hasTime ? "20:00:00" : null,
        frequency: defaultSetting.hasFrequency ? "daily" : null,
        message: null,
      }));
      setSettings(defaultMerged);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (type: string, field: keyof ReminderSetting, value: any) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.type === type 
          ? { ...setting, [field]: value }
          : setting
      )
    );
  };

  const saveSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("auth_token");

      for (const setting of settings) {
        const url = setting.id.startsWith('new-') 
          ? `/api/users/${user.id}/reminder-settings`
          : `/api/users/${user.id}/reminder-settings/${setting.id}`;
        
        const method = setting.id.startsWith('new-') ? 'POST' : 'PUT';

        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: setting.type,
            isEnabled: setting.isEnabled,
            time: setting.time,
            frequency: setting.frequency,
            message: setting.message,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save ${setting.type} setting`);
        }
      }

      toast.success("Notification settings saved successfully!");
      
      // Refresh settings to get updated IDs
      await fetchSettings();
      
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await createNotification({
        type: "test",
        title: "Test Notification",
        message: "This is a test notification to verify your settings are working correctly.",
        metadata: { category: "test", priority: "low" },
      });
      
      toast.success("Test notification sent!");
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    }
  };

  const checkPushSupport = async () => {
    const supported = pushService.isSupported();
    setPushSupported(supported);
    
    // Check if running on Android
    setIsAndroid(pushService.isAndroid());
    setIsPWA(pushService.isPWA());
    
    if (supported) {
      const permission = pushService.getPermissionStatus();
      setPushPermission(permission);
      
      const subscription = await pushService.getCurrentSubscription();
      setPushEnabled(!!subscription);
    }
  };

  const togglePushNotifications = async () => {
    if (!user || !pushSupported) return;

    try {
      if (pushEnabled) {
        await pushService.unsubscribe(user.id);
        setPushEnabled(false);
        toast.success("Push notifications disabled");
      } else {
        const subscription = await pushService.subscribe(user.id);
        if (subscription) {
          setPushEnabled(true);
          toast.success("Push notifications enabled");
        } else {
          toast.error("Failed to enable push notifications. Please check your browser settings.");
        }
      }
    } catch (error) {
      console.error("Error toggling push notifications:", error);
      toast.error("Failed to toggle push notifications");
    }
  };

  const testPushNotification = async () => {
    if (!user || !pushEnabled) return;

    try {
      await pushService.testPushNotification(user.id);
      toast.success("Test push notification sent!");
    } catch (error) {
      console.error("Error sending test push notification:", error);
      toast.error("Failed to send test push notification");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access notification settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Notification Settings</h1>
            <p className="text-rose-100">Customize your notification preferences</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {loading ? (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-rose-500" />
              <p className="text-gray-600">Loading notification settings...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Push Notifications */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-500" />
                  Push Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!pushSupported ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Push notifications are not supported in your browser. You'll still receive in-app notifications.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">
                          Browser Push Notifications
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          Receive notifications even when the app is closed.
                        </p>
                      </div>
                      <Switch
                        checked={pushEnabled}
                        onCheckedChange={togglePushNotifications}
                        disabled={pushPermission === 'denied'}
                      />
                    </div>

                    {pushPermission === 'denied' && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          Push notifications are blocked. Please enable them in your browser settings and refresh the page.
                        </p>
                      </div>
                    )}

                    {pushEnabled && (
                      <div className="space-y-3">
                        <Button
                          onClick={testPushNotification}
                          variant="outline"
                          size="sm"
                        >
                          Test Push Notification
                        </Button>
                        <p className="text-xs text-gray-500">
                          This will send a test notification to all your devices.
                        </p>
                        
                        {/* Android-specific info */}
                        {isAndroid && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-green-600">📱</span>
                              <span className="text-sm font-medium text-green-800">
                                Android Device Detected
                              </span>
                            </div>
                            <p className="text-xs text-green-700">
                              {isPWA 
                                ? "✅ Running as PWA - notifications will appear in your Android notification panel!"
                                : "💡 Tip: Add this app to your home screen for native-like notifications!"
                              }
                            </p>
                            {!isPWA && (
                              <p className="text-xs text-green-600 mt-1">
                                Tap the menu button in your browser and select "Add to Home screen"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Notifications */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-rose-500" />
                  Test Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Send a test notification to make sure everything is working correctly.
                </p>
                <Button onClick={sendTestNotification} variant="outline">
                  Send Test Notification
                </Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {defaultSettings.map((defaultSetting) => {
                  const setting = settings.find(s => s.type === defaultSetting.type);
                  if (!setting) return null;

                  return (
                    <div key={defaultSetting.type} className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-base font-medium">
                            {defaultSetting.label}
                          </Label>
                          <p className="text-sm text-gray-600 mt-1">
                            {defaultSetting.description}
                          </p>
                        </div>
                        <Switch
                          checked={setting.isEnabled}
                          onCheckedChange={(checked) => 
                            updateSetting(setting.type, "isEnabled", checked)
                          }
                        />
                      </div>

                      {setting.isEnabled && (
                        <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                          {defaultSetting.hasTime && (
                            <div>
                              <Label className="text-sm">Reminder Time</Label>
                              <Input
                                type="time"
                                value={setting.time?.substring(0, 5) || "20:00"}
                                onChange={(e) => 
                                  updateSetting(setting.type, "time", e.target.value + ":00")
                                }
                                className="mt-1"
                              />
                            </div>
                          )}

                          {defaultSetting.hasFrequency && (
                            <div>
                              <Label className="text-sm">Frequency</Label>
                              <Select
                                value={setting.frequency || "daily"}
                                onValueChange={(value) => 
                                  updateSetting(setting.type, "frequency", value)
                                }>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          <div>
                            <Label className="text-sm">Custom Message (Optional)</Label>
                            <Input
                              value={setting.message || ""}
                              onChange={(e) => 
                                updateSetting(setting.type, "message", e.target.value)
                              }
                              placeholder="Enter a custom message for this notification type"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={saveSettings} 
                disabled={saving}
                className="bg-rose-500 hover:bg-rose-600">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
