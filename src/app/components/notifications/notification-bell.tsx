"use client"

import { Bell, RefreshCw } from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotifications } from "./notification-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications, isLoading } = useNotifications()
  const [open, setOpen] = useState(false)

  const handleNotificationClick = (id: string) => {
    markAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleRefresh = async () => {
    await refreshNotifications()
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "MMM d, yyyy h:mm a")
    } catch (e) {
      return dateString
    }
  }

  // Refresh notifications when the popover opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      refreshNotifications()
    }
    setOpen(isOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center translate-x-1/4 -translate-y-1/4">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
        {notifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-muted transition-colors",
                    !notification.read && "bg-muted/50",
                  )}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <p className={cn("text-sm", !notification.read && "font-medium")}>{notification.message}</p>
                    {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 mt-1"></div>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(notification.date)}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {isLoading ? "Loading notifications..." : "No notifications"}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

