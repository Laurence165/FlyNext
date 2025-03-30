"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useState, useEffect } from "react"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Use state to track if we're on the client
  const [mounted, setMounted] = useState(false)

  // Only run once on the client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Use suppressHydrationWarning to prevent hydration mismatch warnings
  return (
    <NextThemesProvider {...props}>
      <div suppressHydrationWarning>
        {/* Only render children when mounted on the client */}
        {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
      </div>
    </NextThemesProvider>
  )
}

