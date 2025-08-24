"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  Users,
  Mail,
  Calendar,
  Clock,
  Check,
  Archive,
  Trash2,
} from "lucide-react";
import { getAuthenticatedUser } from "@/lib/auth";

const client = generateClient<Schema>();

interface Notification {
  id: string;
  type: "task" | "document" | "communication" | "system" | "reminder";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: "low" | "medium" | "high";
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUserInfo();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
      // Set up polling for real-time updates
      const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentUserId, filter]);

  const getUserInfo = async () => {
    const authUser = await getAuthenticatedUser();
    if (authUser) {
      setCurrentUserId(authUser.id);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const allNotifications: Notification[] = [];

      // Tasks removed - using external task management system

      // Fetch documents requiring signature
      const { data: documents } = await client.models.Document.list({
        filter: { 
          userId: { eq: currentUserId },
          signatureStatus: { eq: "pending" }
        }
      });

      const docNotifications = documents.map(doc => ({
        id: `doc-${doc.id}`,
        type: "document" as const,
        title: "Signature Required",
        message: `Please sign "${doc.name}"`,
        timestamp: new Date(doc.createdAt),
        read: false,
        priority: "high" as const,
        actionUrl: "/documents",
        metadata: { documentId: doc.id },
      }));
      allNotifications.push(...docNotifications);

      // Fetch recent communications
      const { data: communications } = await client.models.Communication.list({
        filter: { recipientId: { eq: currentUserId } }
      });

      const commNotifications = communications
        .filter(comm => {
          const sentDate = new Date(comm.sentDate || comm.createdAt);
          const daysSince = (Date.now() - sentDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince <= 7; // Last 7 days
        })
        .map(comm => ({
          id: `comm-${comm.id}`,
          type: "communication" as const,
          title: comm.type === "email" ? "New Email" : comm.type === "slack" ? "New Slack Message" : "New Notification",
          message: comm.subject || "You have a new message",
          timestamp: new Date(comm.sentDate || comm.createdAt),
          read: false,
          priority: "medium" as const,
          actionUrl: "/communications",
          metadata: { communicationId: comm.id, type: comm.type },
        }));
      allNotifications.push(...commNotifications);

      // Add system notifications (mock data for now)
      const systemNotifications: Notification[] = [
        {
          id: "sys-1",
          type: "system",
          title: "Welcome to Chinchilla!",
          message: "Complete your onboarding tasks to get started",
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          read: false,
          priority: "low",
          actionUrl: "/onboarding",
        },
      ];
      allNotifications.push(...systemNotifications);

      // Sort by timestamp
      allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply filter
      const filteredNotifications = filter === "unread" 
        ? allNotifications.filter(n => !n.read)
        : allNotifications;

      setNotifications(filteredNotifications.slice(0, 20)); // Limit to 20 most recent
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "task":
        return <CheckCircle className="w-5 h-5" />;
      case "document":
        return <FileText className="w-5 h-5" />;
      case "communication":
        return <Mail className="w-5 h-5" />;
      case "system":
        return <Info className="w-5 h-5" />;
      case "reminder":
        return <Clock className="w-5 h-5" />;
    }
  };

  const getIconColor = (type: Notification["type"], priority: Notification["priority"]) => {
    if (priority === "high") return "text-red-500";
    
    switch (type) {
      case "task":
        return "text-green-500";
      case "document":
        return "text-blue-500";
      case "communication":
        return "text-purple-500";
      case "system":
        return "text-gray-500";
      case "reminder":
        return "text-yellow-500";
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    
    return timestamp.toLocaleDateString();
  };

  return (
    <>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:ring-1 focus:ring-black focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
              </select>
              <button
                onClick={markAllAsRead}
                className="text-sm text-gray-600 hover:text-gray-900"
                title="Mark all as read"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications</p>
              </div>
            )}

            {!loading && notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 hover:bg-gray-50 border-b transition-colors ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={getIconColor(notification.type, notification.priority)}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {getTimeAgo(notification.timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {notification.actionUrl && (
                  <a
                    href={notification.actionUrl}
                    className="inline-block mt-2 text-xs text-black hover:text-gray-700 font-medium"
                  >
                    View Details →
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t">
              <a
                href="#"
                className="text-sm text-center text-black hover:text-gray-700 font-medium block"
              >
                View All Notifications
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}