"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart } from "lucide-react"

import { useBooking } from "../components/booking/booking-context"
import CartSummary from "../components/booking/cart-summary"
import CrossSell from "../components/booking/cross-sell"
import { useAuth } from "../components/auth/auth-context"

export default function CartPage() {
  const { cart } = useBooking()
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // For frontend testing purposes, we'll skip the authentication check
  useEffect(() => {
    // No redirect needed for frontend testing
  }, [])

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8 flex items-center">
        <ShoppingCart className="mr-2 h-6 w-6" />
        Your Cart
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <CrossSell />
        </div>
        <div>
          <CartSummary />
        </div>
      </div>
    </div>
  )
}

