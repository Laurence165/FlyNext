"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CreditCard } from "lucide-react"

import { useBooking } from "../components/booking/booking-context"
import CartSummary from "../components/booking/cart-summary"
import CheckoutForm from "../components/booking/checkout-form"
import { useAuth } from "../components/auth/auth-context"

export default function CheckoutPage() {
  const { cart } = useBooking()
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // For frontend testing purposes, we'll skip the authentication check
  useEffect(() => {
    // Only redirect if cart is empty
    if (!isLoading && cart.length === 0) {
      router.push("/cart")
    }
  }, [cart, isLoading, router])

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (cart.length === 0) {
    return <div className="container mx-auto px-4 py-8 text-center">Your cart is empty</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8 flex items-center">
        <CreditCard className="mr-2 h-6 w-6" />
        Checkout
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Payment Details</h2>
            <CheckoutForm />
          </div>
        </div>
        <div>
          <CartSummary hideCheckoutButton={true} />
        </div>
      </div>
    </div>
  )
}

