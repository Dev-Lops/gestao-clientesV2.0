import { useState } from "react";
import useSWR from "swr";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
  link: string;
  priority?: string;
  clientId: string;
  createdAt: Date;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

const fetcher = async (url: string) => {
  const res = await fetch(url, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export function useNotifications(options?: {
  unreadOnly?: boolean;
  limit?: number;
  type?: string;
}) {
  const { unreadOnly = false, limit = 50, type } = options || {};

  const params = new URLSearchParams();
  if (unreadOnly) params.set("unread", "true");
  params.set("limit", limit.toString());
  if (type) params.set("type", type);

  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    `/api/notifications?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 30000, // Atualizar a cada 30 segundos
      revalidateOnFocus: true,
    },
  );

  const [actionLoading, setActionLoading] = useState(false);

  const markAsRead = async (id: string) => {
    setActionLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "mark_read", id }),
      });
      await mutate();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const markMultipleAsRead = async (ids: string[]) => {
    setActionLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "mark_multiple_read", ids }),
      });
      await mutate();
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const markAllAsRead = async () => {
    setActionLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      await mutate();
    } catch (err) {
      console.error("Error marking all as read:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    setActionLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "delete", id }),
      });
      await mutate();
    } catch (err) {
      console.error("Error deleting notification:", err);
    } finally {
      setActionLoading(false);
    }
  };

  return {
    notifications: data?.notifications || [],
    total: data?.total || 0,
    unreadCount: data?.unreadCount || 0,
    hasMore: data?.hasMore || false,
    isLoading,
    error,
    actionLoading,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: mutate,
  };
}
