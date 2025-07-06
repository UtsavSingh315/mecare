"use client";

import { useState } from "react";
import { ArrowLeft, Bell, Check, Trash2, RefreshCw, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationAnalytics } from "@/components/notification-analytics";
import { useNotifications } from "@/contexts/notifications-context";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "period_reminder": return "🔴";
      case "log_reminder": return "📝";
      case "cycle_insight": return "💡";
      case "achievement": return "🏆";
      case "medication_reminder": return "💊";
      case "symptom_alert": return "⚠️";
      default: return "🔔";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getFilteredNotifications = (filter: string) => {
    switch (filter) {
      case "unread":
        return notifications.filter(n => !n.isRead);
      case "health":
        return notifications.filter(n => 
          ["period_reminder", "medication_reminder", "symptom_alert"].includes(n.type)
        );
      case "insights":
        return notifications.filter(n => 
          ["cycle_insight", "achievement"].includes(n.type)
        );
      case "reminders":
        return notifications.filter(n => n.type === "log_reminder");
      default:
        return notifications;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Access Required</h2>
          <p className="text-gray-600">Please log in to view notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-rose-100">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshNotifications}
            className="text-white hover:bg-white/20">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="p-4 border-b">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="health">Health</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="reminders">Reminders</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
              </div>

              {['all', 'unread', 'health', 'insights', 'reminders'].map(tabName => (
                <TabsContent key={tabName} value={tabName} className="m-0">
                  {loading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading notifications...</p>
                    </div>
                  ) : getFilteredNotifications(tabName).length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <h3 className="text-lg font-medium mb-2">No notifications</h3>
                      <p className="text-sm text-gray-400">
                        No {tabName} notifications found
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-2 p-4">
                        {getFilteredNotifications(tabName).map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                              !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                            }`}>
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h3 className="font-medium">{notification.title}</h3>
                                    {notification.message && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        {notification.message}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {notification.type.replace(/_/g, " ")}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {formatTime(notification.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => 
                                        notification.isRead ? markAsUnread(notification.id) : markAsRead(notification.id)
                                      }>
                                        <Check className="h-4 w-4 mr-2" />
                                        {notification.isRead ? 'Mark as unread' : 'Mark as read'}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => deleteNotification(notification.id)}
                                        className="text-red-600">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              ))}

              <TabsContent value="analytics">
                <div className="p-4">
                  <NotificationAnalytics />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}