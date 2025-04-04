"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import { notificationAPI } from "@/app/services/api"

export type Notification = {
  id: string
  userId: string
  type: "booking_confirmed" | "booking_cancelled" | "booking_updated" | "hotel_booked"
  message: string
  date: string
  read: boolean
}

type NotificationContextType = {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Omit<Notification, "id" | "date" | "read">) => void
  refreshNotifications: () => Promise<void>
  isLoading: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Mock notifications for fallback
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    userId: "1",
    type: "booking_confirmed",
    message: "Your booking #B1001 has been confirmed.",
    date: "2023-05-20T10:30:00Z",
    read: false,
  },
  // ... other mock notifications
]

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [apiAvailable, setApiAvailable] = useState(true)

  // Extract this to a reusable function for refreshing notifications
  const refreshNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await notificationAPI.getNotifications()
      
      // Ensure fetchedNotifications is an array
      const fetchedNotifications = Array.isArray(response) ? response : []
      
      setNotifications(fetchedNotifications)
      setUnreadCount(fetchedNotifications.filter((n: Notification) => !n.read).length)
      setApiAvailable(true)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      // Fallback to mock data if API fails
      setNotifications(MOCK_NOTIFICATIONS)
      setUnreadCount(MOCK_NOTIFICATIONS.filter((n) => !n.read).length)
      setApiAvailable(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch notifications from API on initial load
  useEffect(() => {
    refreshNotifications()

    // Set up a refresh interval (every 30 seconds)
    const intervalId = setInterval(() => {
      refreshNotifications()
    }, 30000)

    return () => clearInterval(intervalId)
  }, [refreshNotifications])

  const markAsRead = async (id: string) => {
    try {
      if (apiAvailable) {
        // Only call API if it's available
        await notificationAPI.markAsRead(id)
      }

      // Update local state regardless
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      )

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      if (apiAvailable) {
        // Only call API if it's available
        await notificationAPI.markAllAsRead()
      }

      // Update local state regardless
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({ ...notification, read: true })),
      )

      // Reset unread count
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const addNotification = (notification: Omit<Notification, "id" | "date" | "read">) => {
    // Create a new notification with unique timestamp-based ID
    const newNotification: Notification = {
      ...notification,
      id: `n${Date.now()}`,
      date: new Date().toISOString(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])
    setUnreadCount((prev) => prev + 1)
    
    // After adding a local notification, refresh from server to sync
    setTimeout(() => refreshNotifications(), 1000)
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        refreshNotifications,
        isLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

