"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Trash2, CreditCard } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useBooking } from "../components/booking/booking-context"
import { useAuth } from "../components/auth/auth-context"

export default function CartPage() {
  const { cart, loading, error, fetchCart, removeFromCart } = useBooking()
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isRemoving, setIsRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated, fetchCart])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?returnTo=/cart")
    }
  }, [isAuthenticated, isLoading, router])

  const handleRemoveItem = async (bookingId: string) => {
    setIsRemoving(bookingId)
    try {
      const success = await removeFromCart(bookingId)
      if (success) {
        toast({
          title: "Item removed",
          description: "The item has been removed from your cart",
        })
      } else {
        throw new Error("Failed to remove item")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      })
    } finally {
      setIsRemoving(null)
    }
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0)
  }

  if (isLoading || loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchCart} className="mt-4">Try Again</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8 flex items-center">
        <ShoppingCart className="mr-2 h-6 w-6" />
        Your Cart
      </h1>

      {cart.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground mb-4">Your cart is empty</p>
          <Button onClick={() => router.push("/flights")}>Browse Flights</Button>
          <Button onClick={() => router.push("/hotels")} className="ml-4">Browse Hotels</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Booking #{item.id.substring(0, 8)}
                      </h3>
                      
                      {/* Hotel Reservations */}
                      {item.reservations && item.reservations.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Hotel Reservations</h4>
                          {item.reservations.map((reservation) => (
                            <div key={reservation.id} className="ml-4 mb-2">
                              <p>
                                {reservation.roomType.hotel.name} - {reservation.roomType.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(reservation.checkInDate), "MMM d, yyyy")} to{" "}
                                {format(new Date(reservation.checkOutDate), "MMM d, yyyy")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {reservation.roomsBooked} room(s)
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Flights */}
                      {item.flights && item.flights.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Flights</h4>
                          {item.flights.map((flight) => (
                            <div key={flight.id} className="ml-4 mb-2">
                              <p>
                                {flight.source} to {flight.destination}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(flight.departureTime), "MMM d, yyyy HH:mm")}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold">${item.totalPrice.toFixed(2)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={isRemoving === item.id}
                      >
                        {isRemoving === item.id ? (
                          "Removing..."
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
                <Separator className="my-4" />
                
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>Booking #{item.id.substring(0, 8)}</span>
                      <span>${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                
                <Button 
                  className="w-full mt-6"
                  onClick={() => router.push("/checkout")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

