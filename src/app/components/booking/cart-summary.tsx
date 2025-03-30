"use client"

import { useBooking } from "./booking-context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, Hotel, X } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"

export default function CartSummary() {
  const { cart, removeFromCart } = useBooking()
  const router = useRouter()

  const flightItem = cart.find((item) => item.type === "flight")
  const hotelItem = cart.find((item) => item.type === "hotel")

  const flightPrice = flightItem?.flight?.price || 0
  const hotelPrice = hotelItem?.hotel?.totalPrice || 0
  const totalPrice = flightPrice + hotelPrice

  const handleRemoveItem = (type: "flight" | "hotel") => {
    removeFromCart(type)
  }

  const handleCheckout = () => {
    if (cart.length > 0) {
      router.push("/checkout")
    }
  }

  if (cart.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Cart</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">Your cart is empty</p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
            Continue Shopping
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Cart</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {flightItem && (
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-2">
                <Plane className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <h3 className="font-medium">Flight</h3>
                  <p className="text-sm text-muted-foreground">
                    {flightItem.flight?.departureCode} to {flightItem.flight?.arrivalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {flightItem.flight?.departureDate}
                    {flightItem.flight?.returnDate && ` - ${flightItem.flight.returnDate}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <p className="font-medium">${flightItem.flight?.price}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem("flight")}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {hotelItem && (
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-2">
                <Hotel className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <h3 className="font-medium">{hotelItem.hotel?.hotelName}</h3>
                  <p className="text-sm text-muted-foreground">{hotelItem.hotel?.roomType}</p>
                  <p className="text-sm text-muted-foreground">
                    {hotelItem.hotel?.checkIn} - {hotelItem.hotel?.checkOut}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hotelItem.hotel?.nights} nights, {hotelItem.hotel?.guests} guests
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <p className="font-medium">${hotelItem.hotel?.totalPrice}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem("hotel")}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex justify-between items-center font-medium">
          <p>Total</p>
          <p>${totalPrice}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleCheckout}>
          Proceed to Checkout
        </Button>
      </CardFooter>
    </Card>
  )
}

