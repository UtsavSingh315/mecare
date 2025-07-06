"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, Users, Bell, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface NotificationAnalytics {
  totalSent: number;
  totalRead: number;
  totalClicked: number;
  readRate: number;
  clickRate: number;
  byType: Array<{
    type: string;
    sent: number;
    read: number;
    clicked: number;
    readRate: number;
    clickRate: number;
  }>;
  byDay: Array<{
    date: string;
    sent: number;
    read: number;
    clicked: number;
  }>;
  deviceBreakdown: Array<{
    deviceType: string;
    count: number;
    active: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function NotificationAnalytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/users/${user.id}/notifications/analytics?range=${timeRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        throw new Error("Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching notification analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "period_reminder":
        return "Period Reminders";
      case "log_reminder":
        return "Log Reminders";
      case "cycle_insight":
        return "Cycle Insights";
      case "achievement":
        return "Achievements";
      case "medication_reminder":
        return "Medication";
      case "symptom_alert":
        return "Symptom Alerts";
      default:
        return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "period_reminder":
        return "🔴";
      case "log_reminder":
        return "📝";
      case "cycle_insight":
        return "💡";
      case "achievement":
        return "🏆";
      case "medication_reminder":
        return "💊";
      case "symptom_alert":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Notification Analytics</h2>
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          No Analytics Available
        </h3>
        <p className="text-gray-500">
          Analytics will appear once you start receiving notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notification Analytics</h2>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSent}</div>
            <Badge variant="secondary" className="mt-1">
              <Bell className="h-3 w-3 mr-1" />
              Notifications
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Read Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.readRate.toFixed(1)}%</div>
            <Badge variant={analytics.readRate > 70 ? "default" : "secondary"} className="mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {analytics.totalRead} read
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Click Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.clickRate.toFixed(1)}%</div>
            <Badge variant={analytics.clickRate > 30 ? "default" : "secondary"} className="mt-1">
              <Users className="h-3 w-3 mr-1" />
              {analytics.totalClicked} clicked
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.deviceBreakdown.reduce((sum, device) => sum + device.active, 0)}
            </div>
            <Badge variant="secondary" className="mt-1">
              <CalendarDays className="h-3 w-3 mr-1" />
              Push enabled
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.byType.map((type) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{getTypeIcon(type.type)}</span>
                      <span className="font-medium text-sm">
                        {getTypeLabel(type.type)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {type.sent} sent
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Read: {type.readRate.toFixed(1)}%
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Click: {type.clickRate.toFixed(1)}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${type.readRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Bar dataKey="sent" fill="#8884d8" name="Sent" />
                <Bar dataKey="read" fill="#82ca9d" name="Read" />
                <Bar dataKey="clicked" fill="#ffc658" name="Clicked" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Device Breakdown */}
      {analytics.deviceBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analytics.deviceBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ deviceType, count }) => `${deviceType}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.deviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {analytics.deviceBreakdown.map((device, index) => (
                  <div key={device.deviceType} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium">{device.deviceType}</span>
                    <Badge variant="outline" className="ml-auto">
                      {device.active}/{device.count} active
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
