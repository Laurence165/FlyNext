import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import ClientProviders from "./components/client-providers"
import Navbar from "./components/navbar"

const inter = Inter({ subsets: ["latin"] })

// export const metadata: Metadata = {
//   title: "FlyNext - Travel Platform",
//   description: "Find your perfect destination",
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <ClientProviders>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1 py-8">{children}</main>
              <footer className="border-t py-6">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                  &copy; {} FlyNext. All rights reserved.
                </div>
              </footer>
            </div>
            <Toaster />
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'