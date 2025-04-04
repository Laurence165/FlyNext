"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  CreditCard,
  Plane,
  Hotel,
  CalendarDays,
  Loader2,
  Clock,
  Package,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useBooking } from "../components/booking/booking-context";
import { useAuth } from "../components/auth/auth-context";
import HotelSuggestions from "../components/hotel-suggestions";

const getStatusColor = (status: string) => {
  switch (status) {
    case "CONFIRMED":
      return "bg-green-100 text-green-800 border-green-300 hover:bg-green-200";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-300 hover:bg-red-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function CartPage() {
  const { cart, loading, error, fetchCart, removeFromCart } = useBooking();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<string | null>(
    null
  );
  const [hotelSuggestions, setHotelSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [destinationCity, setDestinationCity] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?returnTo=/cart");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleRemoveItem = async (bookingId: string) => {
    setIsRemoving(bookingId);
    try {
      const success = await removeFromCart(bookingId);
      if (success) {
        toast({
          title: "Item removed",
          description: "The item has been removed from your cart",
        });
      } else {
        throw new Error("Failed to remove item");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(null);
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  const fetchHotelSuggestions = async (city: string) => {
    try {
      setIsLoadingSuggestions(true);
      console.log("Fetching hotel suggestions for:", city);
      const response = await fetch(
        `/api/suggestions/hotel_suggestions?city=${encodeURIComponent(city)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch hotel suggestions");
      }
      const data = await response.json();
      console.log("Hotel suggestions response:", data);
      setHotelSuggestions(data.hotels || []);
    } catch (error) {
      console.error("Error fetching hotel suggestions:", error);
      setHotelSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleDestinationSelect = (destination: string) => {
    setSelectedDestination(destination);
    fetchHotelSuggestions(destination);
  };

  const fetchDestinationCity = async (airportCode: string) => {
    try {
      console.log("Fetching city for airport code:", airportCode);
      const response = await fetch(`/api/airports/${airportCode}`);
      const data = await response.json();
      console.log("Airport data:", data);
      return data.city?.name || null;
    } catch (error) {
      console.error("Error fetching airport info:", error);
      return null;
    }
  };

  useEffect(() => {
    const getDestinationCity = async () => {
      for (const item of cart) {
        if (item.flights && item.flights.length > 0) {
          const lastFlight = item.flights[item.flights.length - 1];
          if (lastFlight.destination) {
            try {
              const response = await fetch(
                `/api/airports/${lastFlight.destination}`
              );
              const airportData = await response.json();
              if (airportData.city?.name) {
                console.log("Found destination city:", airportData.city.name);
                setDestinationCity(airportData.city.name);
                await fetchHotelSuggestions(airportData.city.name);
              }
            } catch (error) {
              console.error("Error fetching airport data:", error);
            }
          }
        }
      }
    };

    if (cart.length > 0) {
      getDestinationCity();
    }
  }, [cart]);

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading your cart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md mx-auto">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchCart} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <ShoppingCart className="mr-2 h-6 w-6" />
          Your Cart
        </h1>
        <Badge variant="outline" className="text-base px-3 py-1">
          {cart.length} {cart.length === 1 ? "Item" : "Items"}
        </Badge>
      </div>

      {cart.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="py-8">
            <div className="mx-auto rounded-full bg-muted w-16 h-16 flex items-center justify-center mb-4">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xl text-muted-foreground mb-6">
              Your cart is empty
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/flights")}
                variant="outline"
                className="flex gap-2"
              >
                <Plane className="h-4 w-4" />
                Browse Flights
              </Button>
              <Button
                onClick={() => router.push("/hotels")}
                className="flex gap-2"
              >
                <Hotel className="h-4 w-4" />
                Browse Hotels
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </Badge>
                      <CardTitle className="text-lg ml-3">
                        Booking #{item.id.substring(0, 8)}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isRemoving === item.id}
                    >
                      {isRemoving === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pb-4">
                  <Separator className="my-3" />
                  {/* Hotel Reservations */}
                  {item.reservations && item.reservations.length > 0 && (
                    <div className="mb-5 space-y-4">
                      <div className="flex items-center gap-2 text-lg font-medium">
                        <Hotel className="h-5 w-5 text-primary" />
                        <h3>Hotel Reservations</h3>
                      </div>

                      {item.reservations.map((reservation) => (
                        <Card
                          key={reservation.id}
                          className="bg-muted/30 border-muted"
                        >
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {reservation.roomType.hotel.name}
                                </p>
                                <p className="text-sm">
                                  {reservation.roomType.name}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(reservation.status)}
                                >
                                  {reservation.status}
                                </Badge>
                              </div>

                              <div className="flex flex-col items-start md:items-end mt-2 md:mt-0 space-y-1">
                                <div className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    {format(
                                      new Date(reservation.checkInDate),
                                      "MMM d, yyyy"
                                    )}{" "}
                                    to{" "}
                                    {format(
                                      new Date(reservation.checkOutDate),
                                      "MMM d, yyyy"
                                    )}
                                  </p>
                                </div>
                                <p className="text-sm">
                                  {reservation.roomsBooked} room
                                  {reservation.roomsBooked > 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {/* Flights */}
                  {item.flights && item.flights.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-lg font-medium">
                        <Plane className="h-5 w-5 text-primary" />
                        <h3>Flight Bookings</h3>
                      </div>

                      <div className="border rounded-md overflow-hidden bg-muted/30">
                        {/* Group flights into complete journeys/trips */}
                        {(() => {
                          // First sort flights by departure time
                          const sortedFlights = [...item.flights].sort(
                            (a, b) =>
                              new Date(a.departureTime).getTime() -
                              new Date(b.departureTime).getTime()
                          );

                          // Identify round-trip pattern (outbound + return)
                          const isRoundTrip =
                            sortedFlights.length > 1 &&
                            sortedFlights[0].source ===
                              sortedFlights[sortedFlights.length - 1]
                                .destination;

                          // Group flights into complete journeys
                          const journeys = [];
                          let currentJourney = [];
                          let currentDestination = null;

                          // Helper to find the final destination of a journey
                          const findFinalDestination = (flights) => {
                            // For trips with multiple segments, look at connections
                            if (flights.length > 1) {
                              // Find the last segment's destination
                              return flights[flights.length - 1].destination;
                            }
                            return flights[0].destination;
                          };

                          // Group flights into complete journeys
                          for (let i = 0; i < sortedFlights.length; i++) {
                            const flight = sortedFlights[i];

                            // Start a new journey if:
                            // 1. This is the first flight
                            // 2. This flight doesn't connect with the previous one
                            // 3. This is a return flight in a round trip
                            if (
                              currentJourney.length === 0 ||
                              flight.source !== currentDestination ||
                              (isRoundTrip &&
                                i > 0 &&
                                flight.source === sortedFlights[0].source)
                            ) {
                              // Start a new journey if needed
                              if (currentJourney.length > 0) {
                                journeys.push([...currentJourney]);
                                currentJourney = [];
                              }
                            }

                            // Add flight to current journey
                            currentJourney.push(flight);
                            currentDestination = flight.destination;
                          }

                          // Add the last journey if it exists
                          if (currentJourney.length > 0) {
                            journeys.push(currentJourney);
                          }

                          return journeys.map((journey, journeyIndex) => {
                            const firstFlight = journey[0];
                            const lastFlight = journey[journey.length - 1];
                            const source = firstFlight.source;
                            const finalDestination = lastFlight.destination;

                            return (
                              <div
                                key={journeyIndex}
                                className="p-4 border-b last:border-b-0"
                              >
                                <div className="flex flex-col md:flex-row justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={getStatusColor(
                                        firstFlight.status
                                      )}
                                    >
                                      {firstFlight.status}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                      {source} → {finalDestination}
                                      {journeys.length > 1 && (
                                        <span className="ml-2 text-xs bg-muted-foreground/20 px-2 py-0.5 rounded">
                                          {journeyIndex === 0
                                            ? "Outbound"
                                            : "Return"}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1 md:mt-0">
                                    {format(
                                      new Date(firstFlight.departureTime),
                                      "EEE, MMM d, yyyy"
                                    )}
                                  </div>
                                </div>

                                {journey.map((flight, flightIndex) => (
                                  <div
                                    key={flight.id}
                                    className="ml-2 mb-3 last:mb-0"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex gap-3 items-start">
                                        <div className="text-base font-medium">
                                          {format(
                                            new Date(flight.departureTime),
                                            "HH:mm"
                                          )}
                                        </div>
                                        <div className="flex flex-col items-center mt-1">
                                          <div className="text-xs text-muted-foreground">
                                            {(() => {
                                              const durationMs =
                                                new Date(
                                                  flight.arrivalTime
                                                ).getTime() -
                                                new Date(
                                                  flight.departureTime
                                                ).getTime();
                                              const hours = Math.floor(
                                                durationMs / (1000 * 60 * 60)
                                              );
                                              const minutes = Math.floor(
                                                (durationMs %
                                                  (1000 * 60 * 60)) /
                                                  (1000 * 60)
                                              );
                                              return `${
                                                hours ? hours + "h " : ""
                                              }${minutes}m`;
                                            })()}
                                          </div>
                                          <div className="relative w-16 my-1">
                                            <div className="h-[2px] bg-muted-foreground/30 w-full"></div>
                                            <div className="absolute right-0 h-2 w-2 rounded-full bg-muted-foreground top-1/2 -translate-y-1/2"></div>
                                          </div>
                                        </div>
                                        <div className="text-base font-medium">
                                          {format(
                                            new Date(flight.arrivalTime),
                                            "HH:mm"
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-sm text-right">
                                        <p>
                                          {flight.source} → {flight.destination}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Add layover information if there's another flight in this journey */}
                                    {flightIndex < journey.length - 1 && (
                                      <div className="ml-7 pl-2 border-l-2 border-dashed border-muted-foreground/30 text-xs text-muted-foreground py-2">
                                        <Clock className="h-3 w-3 inline mr-1" />
                                        <span>
                                          {(() => {
                                            const layoverMs =
                                              new Date(
                                                journey[
                                                  flightIndex + 1
                                                ].departureTime
                                              ).getTime() -
                                              new Date(
                                                flight.arrivalTime
                                              ).getTime();
                                            const hours = Math.floor(
                                              layoverMs / (1000 * 60 * 60)
                                            );
                                            const minutes = Math.floor(
                                              (layoverMs % (1000 * 60 * 60)) /
                                                (1000 * 60)
                                            );
                                            return `${
                                              hours ? hours + "h " : ""
                                            }${minutes}m layover`;
                                          })()}{" "}
                                          in {flight.destination}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-0 pb-4">
                  <div className="w-full flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <Card className="border shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.reservations &&
                            item.reservations.length > 0 &&
                            "Hotel "}
                          {item.flights && item.flights.length > 0 && "Flight "}
                          Booking #{item.id.substring(0, 6)}
                        </span>
                        <span>${item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex justify-between font-medium">
                    <span>Subtotal</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Taxes & Fees</span>
                    <span>Included</span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => router.push("/checkout")}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Proceed to Checkout
                  </Button>
                </CardFooter>
              </Card>

              {destinationCity && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Hotel className="h-5 w-5" />
                      Add Hotel in {destinationCity}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSuggestions ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <HotelSuggestions
                        hotels={hotelSuggestions}
                        onClose={() => setSelectedDestination(null)}
                      />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
