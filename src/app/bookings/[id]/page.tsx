"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, ArrowLeft, Plane, Hotel } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useBooking } from "../../components/booking/booking-context"
import { useAuth } from "../../components/auth/auth-context"
import PDFGenerator from "../../components/booking/pdf-generator"

export default function BookingConfirmationPage({ params }: { params: { id: string } }) {
  const { getBookingById } = useBooking()
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const booking = getBookingById(params.id)

  // For frontend testing purposes, we'll skip the authentication check
  useEffect(() => {
    // No redirect needed for frontend testing
  }, [])

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The booking you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Button asChild>
          <Link href="/bookings">View All Bookings</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Bookings
            </Link>
          </Button>

          <div className="flex items-center justify-center flex-col text-center mb-8">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Booking Confirmed!</h1>
            <p className="text-muted-foreground mt-2">Your booking #{booking.id} has been confirmed</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {booking.flight && (
              <div className="space-y-3">
                <div className="flex items-center">
                  <Plane className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="text-lg font-semibold">Flight Details</h3>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Airline</p>
                      <p>{booking.flight.airline}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Flight Number</p>
                      <p>{booking.flight.flightNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Departure</p>
                      <p>
                        {booking.flight.departureCode} - {booking.flight.departureTime}
                      </p>
                      <p className="text-sm">{booking.flight.departureDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Arrival</p>
                      <p>
                        {booking.flight.arrivalCode} - {booking.flight.arrivalTime}
                      </p>
                    </div>
                  </div>

                  {booking.flight.tripType === "roundTrip" && booking.flight.returnFlightNumber && (
                    <>
                      <Separator className="my-4" />
                      <p className="text-sm text-muted-foreground mb-2">Return Flight</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Airline</p>
                          <p>{booking.flight.returnAirline}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Flight Number</p>
                          <p>{booking.flight.returnFlightNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Departure</p>
                          <p>
                            {booking.flight.returnDepartureCode} - {booking.flight.returnDepartureTime}
                          </p>
                          <p className="text-sm">{booking.flight.returnDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Arrival</p>
                          <p>
                            {booking.flight.returnArrivalCode} - {booking.flight.returnArrivalTime}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator className="my-4" />
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Passengers</p>
                      <p>{booking.flight.passengers}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-medium">${booking.flight.price}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {booking.hotel && (
              <div className="space-y-3">
                <div className="flex items-center">
                  <Hotel className="h-5 w-5 mr-2 text-primary" />
                  <h3 className="text-lg font-semibold">Hotel Details</h3>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Hotel</p>
                      <p>{booking.hotel.hotelName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Room Type</p>
                      <p>{booking.hotel.roomType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-in</p>
                      <p>{booking.hotel.checkIn}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-out</p>
                      <p>{booking.hotel.checkOut}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nights</p>
                      <p>{booking.hotel.nights}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Guests</p>
                      <p>{booking.hotel.guests}</p>
                    </div>
                  </div>

                  <Separator className="my-4" />
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Price per Night</p>
                      <p>${booking.hotel.pricePerNight}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Price</p>
                      <p className="font-medium">${booking.hotel.totalPrice}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-semibold">${booking.totalAmount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p>
                  {booking.paymentMethod} {booking.cardLastFour && `(**** ${booking.cardLastFour})`}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <PDFGenerator booking={booking} />
          </CardFooter>
        </Card>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Thank you for booking with FlyNext! A confirmation email has been sent to your registered email address.
          </p>
          <Button asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

