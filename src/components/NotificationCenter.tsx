"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  CreditCard,
  FileText,
  ListTodo,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface NotificationCenterProps {
  variant?: "default" | "compact" | "pill";
  className?: string;
}

const NotificationIcon = ({
  type,
  priority,
}: {
  type: string;
  priority?: string;
}) => {
  const getColor = () => {
    if (priority === "urgent") return "text-red-600 bg-red-100";
    if (priority === "high") return "text-orange-600 bg-orange-100";
    return "text-blue-600 bg-blue-100";
  };

  const getIcon = () => {
    switch (type) {
      case "task":
      case "task_created":
      case "task_updated":
      case "task_completed":
      case "task_overdue":
        return <ListTodo className="h-4 w-4" />;
      case "meeting":
      case "meeting_created":
      case "meeting_updated":
      case "meeting_cancelled":
        return <Calendar className="h-4 w-4" />;
      case "payment":
      case "payment_confirmed":
      case "payment_overdue":
      case "installment_created":
        return <CreditCard className="h-4 w-4" />;
      case "client_created":
      case "client_updated":
      case "client_deleted":
        return <Users className="h-4 w-4" />;
      case "member_added":
      case "member_removed":
        return <UserPlus className="h-4 w-4" />;
      case "finance_created":
      case "finance_updated":
        return <FileText className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={`h-10 w-10 rounded-full flex items-center justify-center ${getColor()}`}
    >
      {getIcon()}
    </div>
  );
};

export function NotificationCenter({
  variant = "default",
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const {
    notifications,
    unreadCount,
    isLoading,
    actionLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    unreadOnly: filter === "unread",
  });

  const handleNotificationClick = async (
    notification: (typeof notifications)[0],
  ) => {
    if (notification.unread) {
      await markAsRead(notification.id);
    }
  };

  const baseUnread = unreadCount > 9 ? "9+" : unreadCount;

  // Deduplicate notifications by id to prevent React key collisions
  const uniqueNotifications = useMemo(() => {
    const seen = new Set<string>();
    const deduped = notifications.filter(n => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
    if (deduped.length !== notifications.length) {
      // Log collision info (can be replaced with proper logger later)
      console.warn('[NotificationCenter] Duplicate notification IDs filtered:', notifications.length - deduped.length);
    }
    return deduped;
  }, [notifications]);
  const renderButton = () => {
    const baseBtn =
      "relative flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";
    const baseColors =
      "bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800";
    if (variant === "compact") {
      return (
        <Button
          variant="ghost"
          size="icon"
          className={cn(baseBtn, baseColors, "h-10 w-10 rounded-xl")}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Notificações"
          title="Notificações"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-0.5 rounded-full bg-red-600 text-[10px] leading-none text-white flex items-center justify-center font-semibold shadow ring-1 ring-white/50 dark:ring-red-900/60">
              {baseUnread}
            </span>
          )}
        </Button>
      );
    }
    if (variant === "pill") {
      return (
        <Button
          variant="ghost"
          className={cn(
            baseBtn,
            "h-8 px-3 rounded-full flex items-center gap-2 text-xs font-medium",
            "bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200",
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir notificações"
          title="Abrir notificações"
        >
          <Bell className="h-4 w-4" />
          <span className="hidden xl:inline">Notificações</span>
          {unreadCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-[10px] h-5 px-2 font-semibold shadow ring-1 ring-white/50 dark:ring-red-900/60">
              {baseUnread}
            </span>
          )}
        </Button>
      );
    }
    // default
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(baseBtn, baseColors, "h-10 w-10 rounded-full")}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificações"
        title="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-red-600 text-white text-[11px] flex items-center justify-center font-semibold shadow ring-1 ring-white/50 dark:ring-red-900/60">
            {baseUnread}
          </span>
        )}
      </Button>
    );
  };

  return (
    <div className={cn("relative", className)}>
      {renderButton()}

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay para fechar o painel ao clicar fora */}
          <button
            type="button"
            aria-label="Fechar notificações"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            tabIndex={-1}
            onClick={() => setIsOpen(false)}
          />

          {/* Painel de notificações */}
          <Card
            role="dialog"
            aria-modal="true"
            aria-label="Notificações"
            className="absolute right-0 top-12 w-96 max-h-[600px] z-50 shadow-2xl border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Fechar painel de notificações"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Filtros */}
              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  aria-pressed={filter === "all"}
                  onClick={() => setFilter("all")}
                  className="flex-1"
                >
                  Todas
                </Button>
                <Button
                  variant={filter === "unread" ? "default" : "outline"}
                  size="sm"
                  aria-pressed={filter === "unread"}
                  onClick={() => setFilter("unread")}
                  className="flex-1"
                >
                  Não lidas ({unreadCount})
                </Button>
              </div>

              {/* Marcar todas como lidas */}
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={actionLoading}
                  className="w-full mt-2 text-xs"
                  aria-label="Marcar todas como lidas"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Marcar todas como lidas
                </Button>
              )}
            </div>

            {/* Lista de notificações */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Spinner size="md" variant="primary" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
                  <AlertCircle className="h-12 w-12 mb-2 opacity-30" />
                  <p className="text-sm">
                    {filter === "unread"
                      ? "Nenhuma notificação não lida"
                      : "Nenhuma notificação"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {uniqueNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                        notification.unread && "bg-blue-50/50 dark:bg-blue-950/10"
                      )}
                    >
                      <div className="flex gap-3">
                        <NotificationIcon
                          type={notification.type}
                          priority={notification.priority}
                        />
                        <div className="flex-1 min-w-0">
                          {notification.link ? (
                            <Link
                              href={notification.link}
                              onClick={() => {
                                handleNotificationClick(notification);
                                setIsOpen(false);
                              }}
                              className="block"
                              tabIndex={0}
                              aria-label={notification.title}
                            >
                              <h4 className="font-medium text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                {notification.time}
                              </p>
                            </Link>
                          ) : (
                            <>
                              <h4 className="font-medium text-sm text-slate-900 dark:text-white">
                                {notification.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                {notification.time}
                              </p>
                            </>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {notification.unread && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                disabled={actionLoading}
                                className="h-6 text-xs px-2"
                                aria-label={`Marcar '${notification.title}' como lida`}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Marcar lida
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              disabled={actionLoading}
                              className="h-6 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              aria-label={`Excluir '${notification.title}'`}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
