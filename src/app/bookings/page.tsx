"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Plane, Hotel, X } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBooking, type Booking } from "../components/booking/booking-context"
import { useAuth } from "../components/auth/auth-context"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import PDFGenerator from "../components/booking/pdf-generator"

export default function BookingsPage() {
  const { bookings, cancelBooking } = useBooking()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelType, setCancelType] = useState<"flight" | "hotel" | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // For frontend testing purposes, we'll skip the authentication check
  useEffect(() => {
    // No redirect needed for frontend testing
  }, [])

  const handleCancelBooking = async () => {
    if (!selectedBooking) return

    setIsCancelling(true)
    try {
      await cancelBooking(selectedBooking.id, cancelType || undefined)
      setSelectedBooking(null)
      setCancelType(null)
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  // Use a default user ID for frontend testing purposes if user is null
  const userId = user?.id || "1"

  // Filter bookings for current user
  const userBookings = bookings.filter((booking) => booking.userId === userId)
  const activeBookings = userBookings.filter((booking) => booking.status !== "cancelled")
  const pastBookings = userBookings.filter((booking) => booking.status === "cancelled")

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8 flex items-center">
        <Calendar className="mr-2 h-6 w-6" />
        My Bookings
      </h1>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active">Active Bookings</TabsTrigger>
          <TabsTrigger value="past">Past & Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeBookings.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {activeBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onViewDetails={() => setSelectedBooking(booking)}
                  onCancel={(type) => {
                    setSelectedBooking(booking)
                    setCancelType(type)
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground mb-4">You don't have any active bookings</p>
                <Button asChild>
                  <Link href="/flights">Book a Trip</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastBookings.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {pastBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onViewDetails={() => setSelectedBooking(booking)}
                  isPast
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">You don't have any past or cancelled bookings</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking && !cancelType} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-3xl">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
                <DialogDescription>
                  Booking #{selectedBooking.id} - {selectedBooking.bookingDate}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {selectedBooking.flight && (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Plane className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="text-lg font-semibold">Flight Details</h3>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Airline</p>
                          <p>{selectedBooking.flight.airline}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Flight Number</p>
                          <p>{selectedBooking.flight.flightNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Departure</p>
                          <p>
                            {selectedBooking.flight.departureCode} - {selectedBooking.flight.departureTime}
                          </p>
                          <p className="text-sm">{selectedBooking.flight.departureDate}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Arrival</p>
                          <p>
                            {selectedBooking.flight.arrivalCode} - {selectedBooking.flight.arrivalTime}
                          </p>
                        </div>
                      </div>

                      {selectedBooking.flight.tripType === "roundTrip" && selectedBooking.flight.returnFlightNumber && (
                        <>
                          <Separator className="my-4" />
                          <p className="text-sm text-muted-foreground mb-2">Return Flight</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Airline</p>
                              <p>{selectedBooking.flight.returnAirline}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Flight Number</p>
                              <p>{selectedBooking.flight.returnFlightNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Departure</p>
                              <p>
                                {selectedBooking.flight.returnDepartureCode} -{" "}
                                {selectedBooking.flight.returnDepartureTime}
                              </p>
                              <p className="text-sm">{selectedBooking.flight.returnDate}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Arrival</p>
                              <p>
                                {selectedBooking.flight.returnArrivalCode} - {selectedBooking.flight.returnArrivalTime}
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      <Separator className="my-4" />
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Passengers</p>
                          <p>{selectedBooking.flight.passengers}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-medium">${selectedBooking.flight.price}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBooking.hotel && (
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Hotel className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="text-lg font-semibold">Hotel Details</h3>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Hotel</p>
                          <p>{selectedBooking.hotel.hotelName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Room Type</p>
                          <p>{selectedBooking.hotel.roomType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Check-in</p>
                          <p>{selectedBooking.hotel.checkIn}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Check-out</p>
                          <p>{selectedBooking.hotel.checkOut}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Nights</p>
                          <p>{selectedBooking.hotel.nights}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Guests</p>
                          <p>{selectedBooking.hotel.guests}</p>
                        </div>
                      </div>

                      <Separator className="my-4" />
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Price per Night</p>
                          <p>${selectedBooking.hotel.pricePerNight}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Price</p>
                          <p className="font-medium">${selectedBooking.hotel.totalPrice}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-semibold">${selectedBooking.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={selectedBooking.status === "confirmed" ? "default" : "destructive"}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <PDFGenerator booking={selectedBooking} />

                {selectedBooking.status === "confirmed" && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    {selectedBooking.flight && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(selectedBooking)
                          setCancelType("flight")
                        }}
                      >
                        Cancel Flight
                      </Button>
                    )}

                    {selectedBooking.hotel && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(selectedBooking)
                          setCancelType("hotel")
                        }}
                      >
                        Cancel Hotel
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedBooking(selectedBooking)
                        setCancelType(null)
                        cancelBooking(selectedBooking.id)
                      }}
                    >
                      Cancel Booking
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!selectedBooking && !!cancelType} onOpenChange={(open) => !open && setCancelType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel {cancelType ? `the ${cancelType}` : "this booking"}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setCancelType(null)}>
              Keep Booking
            </Button>
            <Button variant="destructive" onClick={handleCancelBooking} disabled={isCancelling}>
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface BookingCardProps {
  booking: Booking
  onViewDetails: () => void
  onCancel?: (type: "flight" | "hotel" | null) => void
  isPast?: boolean
}

function BookingCard({ booking, onViewDetails, onCancel, isPast = false }: BookingCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Booking #{booking.id}</CardTitle>
            <CardDescription>{booking.bookingDate}</CardDescription>
          </div>
          <Badge variant={booking.status === "confirmed" ? "default" : "destructive"}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {booking.flight && (
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-2">
                <Plane className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">
                    {booking.flight.departureCode} to {booking.flight.arrivalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.flight.departureDate}
                    {booking.flight.returnDate && ` - ${booking.flight.returnDate}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.flight.airline} - {booking.flight.flightNumber}
                  </p>
                </div>
              </div>
              <p className="font-medium">${booking.flight.price}</p>
            </div>
          )}

          {booking.hotel && (
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-2">
                <Hotel className="h-5 w-5 mt-0.5 text-primary" />
                <div>
                  <p className="font-medium">{booking.hotel.hotelName}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.hotel.checkIn} - {booking.hotel.checkOut}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {booking.hotel.roomType} - {booking.hotel.nights} nights
                  </p>
                </div>
              </div>
              <p className="font-medium">${booking.hotel.totalPrice}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <p className="font-medium">Total: ${booking.totalAmount}</p>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onViewDetails}>
                View Details
              </Button>

              {!isPast && booking.status === "confirmed" && onCancel && (
                <Button variant="destructive" onClick={() => onCancel(null)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

