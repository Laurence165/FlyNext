"use client"

import { useBooking } from "./booking-context"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plane, Hotel, X, CreditCard } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface CartSummaryProps {
  hideCheckoutButton?: boolean;
}

export default function CartSummary({ hideCheckoutButton = false }: CartSummaryProps) {
  const { cart, removeFromCart, cartTotal } = useBooking()
  const router = useRouter()

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      // Calculate hotel reservation prices
      if (item.reservations && item.reservations.length > 0) {
        return total + item.reservations.reduce((reservationTotal, reservation) => 
          reservationTotal + (reservation.roomType.pricePerNight * 
            reservation.roomsBooked * 
            Math.round((new Date(reservation.checkOutDate).getTime() - 
              new Date(reservation.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
          ), 0);
      }
      // Use stored price for flights and other booking types
      return total + item.totalPrice;
    }, 0);
  }

  const handleRemoveItem = async (bookingId: string) => {
    await removeFromCart(bookingId)
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
        {cart.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-2">
                {item.flights && item.flights.length > 0 ? (
                  <Plane className="h-5 w-5 mt-0.5 text-primary" />
                ) : (
                  <Hotel className="h-5 w-5 mt-0.5 text-primary" />
                )}
                <div>
                  <h3 className="font-medium">Booking #{item.id.substring(0, 8)}</h3>
                  
                  {/* Flights */}
                  {item.flights && item.flights.length > 0 && (
                    <div>
                      {item.flights.map((flight) => (
                        <p key={flight.id} className="text-sm text-muted-foreground">
                          {flight.source} to {flight.destination}
                          <br />
                          {format(new Date(flight.departureTime), "MMM d, yyyy HH:mm")}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {/* Hotel Reservations */}
                  {item.reservations && item.reservations.length > 0 && (
                    <div>
                      {item.reservations.map((reservation) => (
                        <p key={reservation.id} className="text-sm text-muted-foreground">
                          {reservation.roomType.hotel.name} - {reservation.roomType.name}
                          <br />
                          {format(new Date(reservation.checkInDate), "MMM d, yyyy")} to{" "}
                          {format(new Date(reservation.checkOutDate), "MMM d, yyyy")}
                          <br />
                          {reservation.roomsBooked} room(s)
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <p className="font-medium">
                ${item.reservations && item.reservations.length > 0 
                  ? (item.reservations.reduce((total, reservation) => 
                      total + (reservation.roomType.pricePerNight * 
                        reservation.roomsBooked * 
                        Math.round((new Date(reservation.checkOutDate).getTime() - 
                          new Date(reservation.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
                      ), 0)).toFixed(2)
                  : item.totalPrice.toFixed(2)
                }
                </p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem(item.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        <Separator />

        <div className="flex justify-between items-center font-medium">
          <p>Total</p>
          <p>${calculateTotal().toFixed(2)}</p>
        </div>
      </CardContent>
      <CardFooter>
        {!hideCheckoutButton && cart.length > 0 && (
          <Button className="w-full" onClick={handleCheckout}>
            <CreditCard className="mr-2 h-4 w-4" />
            Proceed to Checkout
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

