"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationService, type Notification } from '@/lib/notificationService';
import { useSession } from 'next-auth/react';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!session?.user?.email) return;
    
    setLoading(true);
    try {
      const userNotifications = await NotificationService.getForUser(session.user.email);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  // Subscribe to new notifications
  useEffect(() => {
    if (!session?.user?.email) return;

    // Load initial notifications
    loadNotifications();

    // Subscribe to new notifications
    const sub = NotificationService.subscribeToNewNotifications(
      session.user.email,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
          });
        }
      }
    );

    setSubscription(sub);

    // Cleanup subscription on unmount
    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [session?.user?.email, loadNotifications]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const markAsRead = async (notificationId: string) => {
    const success = await NotificationService.markAsRead(notificationId);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    if (!session?.user?.email) return;
    
    const success = await NotificationService.markAllAsRead(session.user.email);
    if (success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() }))
      );
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const success = await NotificationService.delete(notificationId);
    if (success) {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}