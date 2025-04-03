"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LogIn, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAuth } from "./auth/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/app/components/themeProvider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBooking } from "./booking/booking-context"
import NotificationBell from "./notifications/notification-bell"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const { user: authUser, logout, isHotelOwner, isLoading } = useAuth()
  const user = authUser
  //  || {
  //   id: "1",
  //   email: "john.doe@example.com",
  //   firstName: "John",
  //   lastName: "Doe",
  //   phone: "+1 (555) 123-4567",
  //   profilePic: "/placeholder.svg?height=200&width=200",
  //   role: "visitor",
  // }
  const { cart } = useBooking()
  const [isMobileView, setIsMobileView] = useState(false)

  // Use useEffect to set small screen view state 
  useEffect(() => {
    setIsMobileView(window.innerWidth < 768)

    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <nav className="bg-background border-b py-4" suppressHydrationWarning>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          FlyNext
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <NavLink href="/" active={pathname === "/"} onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink href="/flights" active={pathname === "/flights"} onClick={closeMenu}>
            Flights
          </NavLink>
          <NavLink href="/hotels" active={pathname === "/hotels"} onClick={closeMenu}>
            Hotels
          </NavLink>
          <ThemeToggle />

          {user ? (
            <div className="flex items-center space-x-2">
              <Link href="/cart" className="relative">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center translate-x-1/4 -translate-y-1/4">
                      {cart.length}
                    </span>
                  )}
                </Button>
              </Link>

              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profilePic} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isHotelOwner ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/hotel-owner/dashboard">Hotel Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/hotel-owner/hotels">My Hotels</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/hotel-owner/bookings">Bookings</Link>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/bookings">My Bookings</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          {user && (
            <div className="flex items-center mr-2">
              <Link href="/cart" className="relative mr-2">
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                  {cart.length > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center translate-x-1/4 -translate-y-1/4">
                      {cart.length}
                    </span>
                  )}
                </Button>
              </Link>

              <NotificationBell />

              <Link href={isHotelOwner ? "/hotel-owner/dashboard" : "/profile"} className="mr-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profilePic} alt={`${user.firstName} ${user.lastName}`} />
                  <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={toggleMenu}>
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && isMobileView && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b z-50">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <NavLink href="/" active={pathname === "/"} onClick={closeMenu}>
              Home
            </NavLink>
            <NavLink href="/flights" active={pathname === "/flights"} onClick={closeMenu}>
              Flights
            </NavLink>
            <NavLink href="/hotels" active={pathname === "/hotels"} onClick={closeMenu}>
              Hotels
            </NavLink>
            <ThemeToggle />

            {user ? (
              <>
                {isHotelOwner ? (
                  <>
                    <NavLink
                      href="/hotel-owner/dashboard"
                      active={pathname === "/hotel-owner/dashboard"}
                      onClick={closeMenu}
                    >
                      Hotel Dashboard
                    </NavLink>
                    <NavLink href="/hotel-owner/hotels" active={pathname === "/hotel-owner/hotels"} onClick={closeMenu}>
                      My Hotels
                    </NavLink>
                    <NavLink
                      href="/hotel-owner/bookings"
                      active={pathname === "/hotel-owner/bookings"}
                      onClick={closeMenu}
                    >
                      Bookings
                    </NavLink>
                  </>
                ) : (
                  <>
                    <NavLink href="/profile" active={pathname === "/profile"} onClick={closeMenu}>
                      Profile
                    </NavLink>
                    <NavLink href="/bookings" active={pathname === "/bookings"} onClick={closeMenu}>
                      My Bookings
                    </NavLink>
                  </>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    logout()
                    closeMenu()
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Button variant="outline" asChild>
                  <Link href="/login" onClick={closeMenu}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Login
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/signup" onClick={closeMenu}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

interface NavLinkProps {
  href: string
  active: boolean
  children: React.ReactNode
  onClick?: () => void
}

function NavLink({ href, active, children, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors hover:text-primary ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}

