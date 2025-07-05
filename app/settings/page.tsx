"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Clock,
  Droplets,
  Pill,
  Settings as SettingsIcon,
  Shield,
  Moon,
  Heart,
  User,
  Calendar,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

export default function SettingsPage() {
  const [periodReminder, setPeriodReminder] = useState(true);
  const [pillReminder, setPillReminder] = useState(false);
  const [waterReminder, setWaterReminder] = useState(true);
  const [logReminder, setLogReminder] = useState(true);
  const [pillTime, setPillTime] = useState("09:00");
  const [waterInterval, setWaterInterval] = useState("2");
  const [logTime, setLogTime] = useState("20:00");
  const [averageCycle, setAverageCycle] = useState("28");
  const [periodLength, setPeriodLength] = useState("5");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user, logout, loading: authLoading } = useAuth();

  // Fetch user profile data on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user || authLoading) return;

      try {
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`/api/users/${user.id}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const profile = await response.json();
          setAverageCycle(profile.averageCycleLength?.toString() || "28");
          setPeriodLength(profile.averagePeriodLength?.toString() || "5");
        } else {
          console.error("Failed to fetch user profile:", response.status);
          // Use default values if profile fetch fails
          setAverageCycle("28");
          setPeriodLength("5");

          if (response.status !== 404) {
            toast.error("Failed to load settings", {
              description:
                "Using default values. Please check your connection.",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Use default values on error
        setAverageCycle("28");
        setPeriodLength("5");
        toast.error("Failed to load settings", {
          description: "Using default values. Please check your connection.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          averageCycleLength: parseInt(averageCycle),
          averagePeriodLength: parseInt(periodLength),
        }),
      });

      if (response.ok) {
        toast.success("Settings saved successfully! ✅", {
          description: "Your cycle preferences have been updated.",
        });
      } else {
        toast.error("Failed to save settings", {
          description: "Please try again later.",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <SettingsIcon className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-rose-100 mt-2">Customize your MeCare experience</p>
      </div>

      {/* Profile Settings */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <User className="w-5 h-5 text-rose-500" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cycle-length" className="text-base font-medium">
              Average Cycle Length (days)
            </Label>
            <Select value={averageCycle} onValueChange={setAverageCycle}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 15 }, (_, i) => i + 21).map((days) => (
                  <SelectItem key={days} value={days.toString()}>
                    {days} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="period-length" className="text-base font-medium">
              Period Length (days)
            </Label>
            <Select value={periodLength} onValueChange={setPeriodLength}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 8 }, (_, i) => i + 3).map((days) => (
                  <SelectItem key={days} value={days.toString()}>
                    {days} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Bell className="w-5 h-5 text-rose-500" />
            Reminders & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Period Reminder */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplets className="w-5 h-5 text-rose-500" />
              <div>
                <Label className="text-base font-medium">Period Reminder</Label>
                <p className="text-sm text-gray-500">
                  Notify before next period
                </p>
              </div>
            </div>
            <Switch
              checked={periodReminder}
              onCheckedChange={setPeriodReminder}
            />
          </div>

          {/* Daily Log Reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-rose-500" />
                <div>
                  <Label className="text-base font-medium">
                    Daily Log Reminder
                  </Label>
                  <p className="text-sm text-gray-500">
                    Remind me to log daily
                  </p>
                </div>
              </div>
              <Switch checked={logReminder} onCheckedChange={setLogReminder} />
            </div>
            {logReminder && (
              <div className="ml-8">
                <Label className="text-sm font-medium">Reminder Time</Label>
                <Input
                  type="time"
                  value={logTime}
                  onChange={(e) => setLogTime(e.target.value)}
                  className="mt-1 w-32"
                />
              </div>
            )}
          </div>

          {/* Pill Reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pill className="w-5 h-5 text-rose-500" />
                <div>
                  <Label className="text-base font-medium">
                    Birth Control Reminder
                  </Label>
                  <p className="text-sm text-gray-500">Daily pill reminder</p>
                </div>
              </div>
              <Switch
                checked={pillReminder}
                onCheckedChange={setPillReminder}
              />
            </div>
            {pillReminder && (
              <div className="ml-8">
                <Label className="text-sm font-medium">Pill Time</Label>
                <Input
                  type="time"
                  value={pillTime}
                  onChange={(e) => setPillTime(e.target.value)}
                  className="mt-1 w-32"
                />
              </div>
            )}
          </div>

          {/* Water Reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-500" />
                <div>
                  <Label className="text-base font-medium">
                    Water Reminder
                  </Label>
                  <p className="text-sm text-gray-500">Stay hydrated</p>
                </div>
              </div>
              <Switch
                checked={waterReminder}
                onCheckedChange={setWaterReminder}
              />
            </div>
            {waterReminder && (
              <div className="ml-8">
                <Label className="text-sm font-medium">Remind every</Label>
                <Select value={waterInterval} onValueChange={setWaterInterval}>
                  <SelectTrigger className="mt-1 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="3">3 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Shield className="w-5 h-5 text-rose-500" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">App Lock</Label>
              <p className="text-sm text-gray-500">
                Require authentication to open app
              </p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                Anonymous Analytics
              </Label>
              <p className="text-sm text-gray-500">Help improve the app</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Moon className="w-5 h-5 text-rose-500" />
            App Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Dark Mode</Label>
              <p className="text-sm text-gray-500">Switch to dark theme</p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">
                Motivational Messages
              </Label>
              <p className="text-sm text-gray-500">Show daily affirmations</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-gray-600" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Name
                </Label>
                <p className="text-gray-800 font-medium">{user.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <p className="text-gray-800">{user.email}</p>
              </div>
              {user.age && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Age
                  </Label>
                  <p className="text-gray-800">{user.age} years old</p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full h-14 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium text-lg shadow-lg disabled:opacity-50">
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
