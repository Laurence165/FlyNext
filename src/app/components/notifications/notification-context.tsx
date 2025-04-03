"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
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
  {
    id: "n2",
    userId: "1",
    type: "booking_confirmed",
    message: "Your booking #B1002 has been confirmed.",
    date: "2023-06-01T14:15:00Z",
    read: true,
  },
  {
    id: "n4",
    userId: "1",
    type: "booking_confirmed",
    message: "Your booking #B1003 has been confirmed.",
    date: "2023-07-15T09:45:00Z",
    read: false,
  },
  {
    id: "n5",
    userId: "1",
    type: "booking_cancelled",
    message: "Your booking #B1004 has been cancelled.",
    date: "2023-08-25T16:20:00Z",
    read: true,
  },
  {
    id: "n6",
    userId: "1",
    type: "booking_confirmed",
    message: "Your booking #B1005 has been confirmed.",
    date: "2023-10-15T11:10:00Z",
    read: false,
  },
  {
    id: "n7",
    userId: "1",
    type: "booking_updated",
    message: "Your flight details for booking #B1003 have been updated.",
    date: "2023-07-20T14:30:00Z",
    read: false,
  },
]

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [apiAvailable, setApiAvailable] = useState(true)

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
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
    }

    fetchNotifications()
  }, [])

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
    // This would typically be handled by a WebSocket or server-sent events
    // For now, we'll just add it to the local state
    const newNotification: Notification = {
      ...notification,
      id: `n${'2020-01-01'}`,
      date: new Date().toISOString(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev])
    setUnreadCount((prev) => prev + 1)
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
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

