"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message?: string | null;
  isRead: boolean;
  scheduledFor?: string | null;
  sentAt?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  // Actions
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAsUnread: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  createNotification: (data: {
    type: string;
    title: string;
    message?: string;
    scheduledFor?: Date;
    metadata?: Record<string, any>;
  }) => Promise<void>;
  // Realtime
  refreshNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}

interface NotificationsProviderProps {
  children: React.ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    if (!user || !isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const queryParams = new URLSearchParams();
      if (unreadOnly) queryParams.set("unread", "true");
      
      const response = await fetch(
        `/api/users/${user.id}/notifications?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/users/${user.id}/notifications/${notificationId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isRead: true }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.status}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
      setError(err instanceof Error ? err.message : "Failed to mark as read");
    }
  }, [user]);

  // Mark notification as unread
  const markAsUnread = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/users/${user.id}/notifications/${notificationId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isRead: false }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark notification as unread: ${response.status}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: false }
            : notification
        )
      );
      setUnreadCount(prev => prev + 1);
    } catch (err) {
      console.error("Error marking notification as unread:", err);
      setError(err instanceof Error ? err.message : "Failed to mark as unread");
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/users/${user.id}/notifications/bulk`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            action: "markAllAsRead",
            notificationIds: []
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to mark all as read: ${response.status}`);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all as read:", err);
      setError(err instanceof Error ? err.message : "Failed to mark all as read");
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/users/${user.id}/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.status}`);
      }

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      setError(err instanceof Error ? err.message : "Failed to delete notification");
    }
  }, [user, notifications]);

  // Delete all notifications
  const deleteAll = useCallback(async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/users/${user.id}/notifications/bulk`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            action: "deleteAll",
            notificationIds: []
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete all notifications: ${response.status}`);
      }

      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Error deleting all notifications:", err);
      setError(err instanceof Error ? err.message : "Failed to delete all");
    }
  }, [user]);

  // Create new notification
  const createNotification = useCallback(async (data: {
    type: string;
    title: string;
    message?: string;
    scheduledFor?: Date;
    metadata?: Record<string, any>;
  }) => {
    if (!user) return;

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/users/${user.id}/notifications`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create notification: ${response.status}`);
      }

      const newNotification = await response.json();
      
      // Add to local state
      setNotifications(prev => [newNotification, ...prev]);
      if (!newNotification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (err) {
      console.error("Error creating notification:", err);
      setError(err instanceof Error ? err.message : "Failed to create notification");
    }
  }, [user]);

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-fetch notifications when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user, fetchNotifications]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user, fetchNotifications]);

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    createNotification,
    refreshNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
