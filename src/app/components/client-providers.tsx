"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "./auth/auth-context"
import { NotificationProvider } from "./notifications/notification-context"
import { BookingProvider } from "./booking/booking-context"

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BookingProvider>{children}</BookingProvider>
      </NotificationProvider>
    </AuthProvider>
  )
}

