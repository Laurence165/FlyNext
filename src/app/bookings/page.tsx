"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plane,
  Hotel,
  X,
  Clock,
  MapPin,
  CalendarDays,
  User,
  Package,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBooking,
  type Booking,
} from "../components/booking/booking-context";
import { useAuth } from "../components/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import PDFGenerator from "../components/booking/pdf-generator";
import { useToast } from "@/components/ui/use-toast";

// Helper function to get color styling based on booking status
const getStatusBadgeStyle = (status: string) => {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
      return "bg-green-100 text-green-800 border-green-300 hover:bg-green-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-300 hover:bg-red-200";
    default:
      return "";
  }
};

export default function BookingsPage() {
  const { bookings, cancelBooking, refreshBookings } = useBooking();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelType, setCancelType] = useState<"flight" | "hotel" | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // No redirect needed for frontend testing
  }, []);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    setIsCancelling(true);
    try {
      const success = await cancelBooking(
        selectedBooking.id,
        cancelType || undefined
      );
      if (success) {
        toast({
          title: "Booking Cancelled",
          description: cancelType
            ? `The ${cancelType} has been cancelled successfully.`
            : "The booking has been cancelled successfully.",
        });

        await refreshBookings();
      } else {
        throw new Error("Failed to cancel booking");
      }
    } catch (error) {
      console.error("Error during cancellation:", error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSelectedBooking(null);
      setCancelType(null);
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
    );
  }

  const userId = user?.id || "1";

  const userBookings = bookings.filter((booking) => booking.userId === userId);

  const activeBookings = userBookings.filter(
    (booking) =>
      booking.status.toUpperCase() === "CONFIRMED" ||
      booking.status.toUpperCase() === "PENDING"
  );
  const pastBookings = userBookings.filter(
    (booking) => booking.status.toUpperCase() === "CANCELLED"
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8 flex items-center">
        <Calendar className="mr-2 h-6 w-6" />
        My Bookings
      </h1>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            Active Bookings
            <Badge variant="outline" className="ml-1 bg-primary/10">
              {activeBookings.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            Past & Cancelled
            <Badge variant="outline" className="ml-1 bg-primary/10">
              {pastBookings.length}
            </Badge>
          </TabsTrigger>
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
                    setSelectedBooking(booking);
                    setCancelType(type);
                  }}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground mb-4">
                  You don't have any active bookings
                </p>
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
                <p className="text-muted-foreground">
                  You don't have any past or cancelled bookings
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!selectedBooking && !cancelType}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
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
                          <p className="text-sm text-muted-foreground">
                            Airline
                          </p>
                          <p>{selectedBooking.flight.airline}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Flight Number
                          </p>
                          <p>{selectedBooking.flight.flightNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Departure
                          </p>
                          <p>
                            {selectedBooking.flight.departureCode} -{" "}
                            {selectedBooking.flight.departureTime}
                          </p>
                          <p className="text-sm">
                            {selectedBooking.flight.departureDate}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Arrival
                          </p>
                          <p>
                            {selectedBooking.flight.arrivalCode} -{" "}
                            {selectedBooking.flight.arrivalTime}
                          </p>
                        </div>
                      </div>

                      {selectedBooking.flight.tripType === "roundTrip" &&
                        selectedBooking.flight.returnFlightNumber && (
                          <>
                            <Separator className="my-4" />
                            <p className="text-sm text-muted-foreground mb-2">
                              Return Flight
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Airline
                                </p>
                                <p>{selectedBooking.flight.returnAirline}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Flight Number
                                </p>
                                <p>
                                  {selectedBooking.flight.returnFlightNumber}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Departure
                                </p>
                                <p>
                                  {selectedBooking.flight.returnDepartureCode} -{" "}
                                  {selectedBooking.flight.returnDepartureTime}
                                </p>
                                <p className="text-sm">
                                  {selectedBooking.flight.returnDate}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">
                                  Arrival
                                </p>
                                <p>
                                  {selectedBooking.flight.returnArrivalCode} -{" "}
                                  {selectedBooking.flight.returnArrivalTime}
                                </p>
                              </div>
                            </div>
                          </>
                        )}

                      <Separator className="my-4" />
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Passengers
                          </p>
                          <p>{selectedBooking.flight.passengers}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-medium">
                            ${selectedBooking.flight.price}
                          </p>
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
                          <p className="text-sm text-muted-foreground">
                            Room Type
                          </p>
                          <p>{selectedBooking.hotel.roomType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Check-in
                          </p>
                          <p>{selectedBooking.hotel.checkIn}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Check-out
                          </p>
                          <p>{selectedBooking.hotel.checkOut}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Nights
                          </p>
                          <p>{selectedBooking.hotel.nights}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Guests
                          </p>
                          <p>{selectedBooking.hotel.guests}</p>
                        </div>
                      </div>

                      <Separator className="my-4" />
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Price per Night
                          </p>
                          <p>${selectedBooking.hotel.pricePerNight}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            Total Price
                          </p>
                          <p className="font-medium">
                            ${selectedBooking.hotel.pricePerNight * selectedBooking.hotel.nights}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Amount
                    </p>
                    <p className="text-lg font-semibold">$
                      {selectedBooking.hotel && !selectedBooking.flight 
                        ? (selectedBooking.hotel.totalPrice || 
                           (selectedBooking.hotel.pricePerNight && selectedBooking.hotel.nights
                            ? Number(selectedBooking.hotel.pricePerNight) * Number(selectedBooking.hotel.nights)
                            : selectedBooking.totalPrice))
                        : selectedBooking.totalPrice}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant="outline"
                      className={getStatusBadgeStyle(selectedBooking.status)}
                    >
                      {selectedBooking.status.charAt(0).toUpperCase() +
                        selectedBooking.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <PDFGenerator booking={selectedBooking} />

                {selectedBooking.status.toUpperCase() !== "CANCELLED" && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    {selectedBooking.flight && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(selectedBooking);
                          setCancelType("flight");
                        }}
                      >
                        Cancel Flight
                      </Button>
                    )}

                    {selectedBooking.hotel && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedBooking(selectedBooking);
                          setCancelType("hotel");
                        }}
                      >
                        Cancel Hotel
                      </Button>
                    )}

                    <Button
                      variant="destructive"
                      onClick={async () => {
                        setIsCancelling(true);
                        try {
                          const success = await cancelBooking(
                            selectedBooking.id
                          );
                          if (success) {
                            toast({
                              title: "Booking Cancelled",
                              description:
                                "The booking has been cancelled successfully.",
                            });
                            await refreshBookings();
                            setSelectedBooking(null);
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description:
                              "Failed to cancel booking. Please try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsCancelling(false);
                        }
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

      <Dialog
        open={!!selectedBooking && !!cancelType}
        onOpenChange={(open) => !open && setCancelType(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cancellation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel{" "}
              {cancelType ? `the ${cancelType}` : "this booking"}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setCancelType(null)}>
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelBooking}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface BookingCardProps {
  booking: Booking;
  onViewDetails: () => void;
  onCancel?: (type: "flight" | "hotel" | null) => void;
  isPast?: boolean;
}

function BookingCard({
  booking,
  onViewDetails,
  onCancel,
  isPast = false,
}: BookingCardProps) {
  console.log("Booking data:", booking);

  const hasNewStructure =
    booking.hasOwnProperty("flights") || booking.hasOwnProperty("reservations");

  let flightInfo = null;
  let hotelInfo = null;

  if (hasNewStructure) {
    flightInfo =
      booking.flights && booking.flights.length > 0 ? booking.flights[0] : null;
    hotelInfo =
      booking.reservations && booking.reservations.length > 0
        ? booking.reservations[0]
        : null;
  } else {
    flightInfo = booking.flight;
    hotelInfo = booking.hotel;
  }

  // Calculate hotel total price based on schema information
  const calculateHotelTotalPrice = () => {
    if (!hotelInfo) return booking.totalPrice;
    
    // For new structure with Reservation model (checkInDate/checkOutDate)
    if (hotelInfo.checkInDate && hotelInfo.checkOutDate) {
      const checkIn = new Date(hotelInfo.checkInDate);
      const checkOut = new Date(hotelInfo.checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return (hotelInfo.roomType?.pricePerNight || 0) * nights * (hotelInfo.roomsBooked || 1);
    }
    
    // For old structure with hotel model (nights & pricePerNight)
    if (hotelInfo.pricePerNight && hotelInfo.nights) {
      return Number(hotelInfo.pricePerNight) * Number(hotelInfo.nights);
    }
    
    // Fallback to any available totalPrice
    return hotelInfo.totalPrice || booking.totalPrice;
  };

  // Calculate the hotel total price
  const hotelTotalPrice = hotelInfo ? calculateHotelTotalPrice() : 0;
  
  // Use hotel total price for hotel-only bookings, otherwise use booking.totalPrice
  const displayTotalPrice = hotelInfo && !flightInfo ? hotelTotalPrice : booking.totalPrice;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">
                Booking #
                {typeof booking.id === "string"
                  ? booking.id.substring(0, 8)
                  : booking.id}
              </CardTitle>
              <CardDescription>
                {booking.bookingDate || booking.createdAt
                  ? new Date(
                      booking.bookingDate || booking.createdAt
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Date not available"}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={getStatusBadgeStyle(booking.status)}
          >
            {booking.status.charAt(0).toUpperCase() +
              booking.status.slice(1).toLowerCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-2 space-y-6">
        {flightInfo && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Plane className="h-5 w-5 text-primary" />
              <h3>Flight Booking</h3>
            </div>

            <div className="border rounded-md overflow-hidden bg-muted/30">
              <div className="p-4">
                <div className="flex flex-col md:flex-row justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={getStatusBadgeStyle(booking.status)}
                    >
                      {booking.status}
                    </Badge>
                    <span className="text-sm font-medium">
                      {hasNewStructure ? (
                        <>
                          {flightInfo.source} → {flightInfo.destination}
                        </>
                      ) : (
                        <>
                          {flightInfo.departureCode} → {flightInfo.arrivalCode}
                          {flightInfo.tripType === "roundTrip" && (
                            <span className="ml-2 text-xs bg-muted-foreground/20 px-2 py-0.5 rounded">
                              Round Trip
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 md:mt-0">
                    {hasNewStructure
                      ? new Date(flightInfo.departureTime).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : flightInfo.departureDate}
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-start">
                      <div className="text-base font-medium">
                        {hasNewStructure
                          ? format(new Date(flightInfo.departureTime), "HH:mm")
                          : flightInfo.departureTime}
                      </div>
                      <div className="flex flex-col items-center mt-1">
                        <div className="text-xs text-muted-foreground">
                          {hasNewStructure
                            ? (() => {
                                const durationMs =
                                  new Date(flightInfo.arrivalTime).getTime() -
                                  new Date(flightInfo.departureTime).getTime();
                                const hours = Math.floor(
                                  durationMs / (1000 * 60 * 60)
                                );
                                const minutes = Math.floor(
                                  (durationMs % (1000 * 60 * 60)) / (1000 * 60)
                                );
                                return `${
                                  hours ? hours + "h " : ""
                                }${minutes}m`;
                              })()
                            : flightInfo.duration || "Direct"}
                        </div>
                        <div className="relative w-16 my-1">
                          <div className="h-[2px] bg-muted-foreground/30 w-full"></div>
                          <div className="absolute right-0 h-2 w-2 rounded-full bg-muted-foreground top-1/2 -translate-y-1/2"></div>
                        </div>
                      </div>
                      <div className="text-base font-medium">
                        {hasNewStructure
                          ? format(new Date(flightInfo.arrivalTime), "HH:mm")
                          : flightInfo.arrivalTime}
                      </div>
                    </div>
                    <div className="text-sm text-right">
                      <p>
                        {hasNewStructure ? (
                          <>
                            {flightInfo.source} → {flightInfo.destination}
                          </>
                        ) : (
                          <>
                            {flightInfo.departureCode} →{" "}
                            {flightInfo.arrivalCode}
                          </>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {hasNewStructure ? (
                          <>Flight #{flightInfo.afsFlightId || flightInfo.id}</>
                        ) : (
                          <>
                            {flightInfo.airline} • {flightInfo.flightNumber}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {!hasNewStructure &&
                  flightInfo.tripType === "roundTrip" &&
                  flightInfo.returnDate && (
                    <>
                      <div className="ml-7 border-l-2 border-dashed border-muted-foreground/30 text-xs text-muted-foreground py-2 px-2">
                        <CalendarDays className="h-3 w-3 inline mr-1" />
                        <span>{flightInfo.returnDate}</span>
                      </div>

                      <div className="mb-3"></div>
                    </>
                  )}

                <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5" />
                    <span>
                      {hasNewStructure ? (
                        "1 passenger"
                      ) : (
                        <>
                          {flightInfo.passengers} passenger
                          {flightInfo.passengers !== 1 ? "s" : ""}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    $
                    {hasNewStructure
                      ? flightInfo.price || booking.totalPrice
                      : flightInfo.price}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {hotelInfo && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-medium">
              <Hotel className="h-5 w-5 text-primary" />
              <h3>Hotel Reservation</h3>
            </div>

            <Card className="bg-muted/30 border-muted">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="space-y-1">
                    {hasNewStructure ? (
                      <>
                        <p className="font-medium">
                          {hotelInfo.roomType?.hotel?.name || "Hotel"}
                        </p>
                        <p className="text-sm">
                          {hotelInfo.roomType?.name || "Room"}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{hotelInfo.hotelName}</p>
                        <p className="text-sm">{hotelInfo.roomType}</p>
                      </>
                    )}
                    <Badge
                      variant="outline"
                      className={getStatusBadgeStyle(booking.status)}
                    >
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="flex flex-col items-start md:items-end mt-2 md:mt-0 space-y-1">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {hasNewStructure ? (
                          <>
                            {format(
                              new Date(hotelInfo.checkInDate),
                              "MMM d, yyyy"
                            )}{" "}
                            to{" "}
                            {format(
                              new Date(hotelInfo.checkOutDate),
                              "MMM d, yyyy"
                            )}
                          </>
                        ) : (
                          <>
                            {hotelInfo.checkIn} to {hotelInfo.checkOut}
                          </>
                        )}
                      </p>
                    </div>
                    <p className="text-sm">
                      {hasNewStructure ? (
                        <>
                          {Math.floor(
                            (new Date(hotelInfo.checkOutDate).getTime() -
                              new Date(hotelInfo.checkInDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          night(s), {hotelInfo.roomsBooked} room(s)
                        </>
                      ) : (
                        <>
                          {hotelInfo.nights} night
                          {hotelInfo.nights > 1 ? "s" : ""},{hotelInfo.guests}{" "}
                          guest
                          {hotelInfo.guests > 1 ? "s" : ""}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                  <p className="text-sm">
                    {hasNewStructure ? (
                      <span className="text-muted-foreground">Room Price</span>
                    ) : (
                      <span className="text-muted-foreground">
                        ${hotelInfo.pricePerNight} per night ×{" "}
                        {hotelInfo.nights} night
                        {hotelInfo.nights > 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                  <p className="font-medium">
                    $
                    {hasNewStructure
                      ? hotelInfo.totalPrice || booking.totalPrice
                      : (hotelInfo.totalPrice || (hotelInfo.pricePerNight * hotelInfo.nights))}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!flightInfo && !hotelInfo && (
          <div className="bg-muted/30 p-4 rounded-lg py-8">
            <div className="text-center mb-4">
              <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">Complete Booking Package</p>
              <p className="text-sm text-muted-foreground mb-2">
                This booking may include multiple items
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-dashed border-border">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="font-medium">{booking.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dashed border-border">
                <span className="text-sm text-muted-foreground">
                  Booking Date
                </span>
                <span className="font-medium">
                  {new Date(
                    booking.bookingDate || booking.createdAt || Date.now()
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-sm text-muted-foreground">Reference</span>
                <span className="font-medium">
                  #
                  {typeof booking.id === "string"
                    ? booking.id.substring(0, 8)
                    : booking.id}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/10 p-4">
        <div className="flex justify-between items-center w-full">
          <div>
            <p className="text-sm text-muted-foreground"></p>
            <p className="text-lg font-semibold">$
              {hotelInfo && !flightInfo 
                ? (hotelInfo.totalPrice || 
                   (hotelInfo.pricePerNight && hotelInfo.nights
                    ? Number(hotelInfo.pricePerNight) * Number(hotelInfo.nights)
                    : booking.totalPrice))
                : booking.totalPrice}
            </p>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={onViewDetails}>
              View Details
            </Button>

            {!isPast &&
              booking.status.toUpperCase() !== "CANCELLED" &&
              onCancel && (
                <Button variant="destructive" onClick={() => onCancel(null)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
