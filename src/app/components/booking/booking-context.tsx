"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { bookingAPI } from "@/app/services/api";
import { useAuth } from "../auth/auth-context";

// Define the types
export type FlightBooking = {
  id: string;
  flightNumber: string;
  airline: string;
  departureCode: string;
  departureTime: string;
  arrivalCode: string;
  arrivalTime: string;
  duration: string;
  price: number;
  passengers: number;
  tripType: "oneWay" | "roundTrip";
  returnFlightNumber?: string;
  returnAirline?: string;
  returnDepartureCode?: string;
  returnDepartureTime?: string;
  returnArrivalCode?: string;
  returnArrivalTime?: string;
  returnDuration?: string;
  departureDate: string;
  returnDate?: string;
};

export type HotelBooking = {
  id: string;
  hotelId: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  totalPrice: number;
};

export type CartItem =
  | { type: "flight"; flight: FlightBooking }
  | { type: "hotel"; hotel: HotelBooking };

export type Booking = {
  id: string;
  userId: string;
  flight?: FlightBooking;
  hotel?: HotelBooking;
  totalPrice: number;
  status: "confirmed" | "cancelled";
  bookingDate: string;
  paymentMethod: string;
  cardLastFour: string;
};

type BookingItem = {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  reservations?: any[];
  flights?: any[];
};

interface BookingContextType {
  cart: BookingItem[];
  bookings: BookingItem[];
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (bookingData: any) => Promise<BookingItem | null>;
  removeFromCart: (bookingId: string) => Promise<boolean>;
  clearCart: () => void;
  refreshBookings: () => Promise<void>;
  cancelBooking: (
    bookingId: string,
    type?: "flight" | "hotel"
  ) => Promise<boolean>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Example cart items for frontend testing
const EXAMPLE_CART_ITEMS: CartItem[] = [
  {
    type: "flight",
    flight: {
      id: "F1001",
      flightNumber: "DL123",
      airline: "Delta Airlines",
      departureCode: "JFK",
      departureTime: "08:30 AM",
      arrivalCode: "LAX",
      arrivalTime: "11:45 AM",
      duration: "6h 15m",
      price: 349,
      passengers: 1,
      tripType: "roundTrip",
      returnFlightNumber: "DL456",
      returnAirline: "Delta Airlines",
      returnDepartureCode: "LAX",
      returnDepartureTime: "02:30 PM",
      returnArrivalCode: "JFK",
      returnArrivalTime: "10:45 PM",
      returnDuration: "5h 15m",
      departureDate: "2023-06-15",
      returnDate: "2023-06-22",
    },
  },
  {
    type: "hotel",
    hotel: {
      id: "H1001",
      hotelId: "hotel1",
      hotelName: "Grand Hotel LA",
      roomType: "Deluxe Double",
      checkIn: "2023-06-15",
      checkOut: "2023-06-22",
      nights: 7,
      guests: 2,
      pricePerNight: 150,
      totalPrice: 1050,
    },
  },
];

// Mock bookings for fallback
const MOCK_BOOKINGS: Booking[] = [
  {
    id: "B1001",
    userId: "1",
    flight: {
      id: "F1001",
      flightNumber: "DL123",
      airline: "Delta Airlines",
      departureCode: "JFK",
      departureTime: "08:30 AM",
      arrivalCode: "LAX",
      arrivalTime: "11:45 AM",
      duration: "6h 15m",
      price: 349,
      passengers: 1,
      tripType: "roundTrip",
      returnFlightNumber: "DL456",
      returnAirline: "Delta Airlines",
      returnDepartureCode: "LAX",
      returnDepartureTime: "02:30 PM",
      returnArrivalCode: "JFK",
      returnArrivalTime: "10:45 PM",
      returnDuration: "5h 15m",
      departureDate: "2023-06-15",
      returnDate: "2023-06-22",
    },
    hotel: {
      id: "H1001",
      hotelId: "hotel1",
      hotelName: "Grand Hotel LA",
      roomType: "Deluxe Double",
      checkIn: "2023-06-15",
      checkOut: "2023-06-22",
      nights: 7,
      guests: 2,
      pricePerNight: 150,
      totalPrice: 1050,
    },
    totalPrice: 1399,
    status: "confirmed",
    bookingDate: "2023-05-20",
    paymentMethod: "Credit Card",
    cardLastFour: "4242",
  },
  // Other mock bookings...
];

export function BookingProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<BookingItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  // Debug function to visualize booking structure
  const logBookingStructure = (booking) => {
    console.group(
      `%cBooking Details (ID: ${booking.id})`,
      "color: purple; font-weight: bold;"
    );
    console.log(`Status: ${booking.status}`);
    console.log(`Total Price: $${booking.totalPrice}`);

    // Log flight information with details
    if (booking.flights && booking.flights.length > 0) {
      console.group("%cFlights", "color: blue; font-weight: bold;");
      console.log(`Total Flight Segments: ${booking.flights.length}`);

      // Group flights by journeys
      const sortedFlights = [...booking.flights].sort(
        (a, b) =>
          new Date(a.departureTime).getTime() -
          new Date(b.departureTime).getTime()
      );

      // Try to identify journey segments
      let currentSource = null;
      let journeyCount = 0;

      sortedFlights.forEach((flight, index) => {
        if (
          !currentSource ||
          flight.source !== sortedFlights[index - 1]?.destination
        ) {
          // This appears to be the start of a new journey
          journeyCount++;
          console.group(
            `%cJourney #${journeyCount}`,
            "color: green; font-weight: bold;"
          );
          currentSource = flight.source;
        }

        console.group(
          `Flight Segment ${index + 1}: ${flight.source} → ${
            flight.destination
          }`
        );
        console.log(`ID: ${flight.id}`);
        console.log(`AFS Flight ID: ${flight.afsFlightId}`);
        console.log(
          `Departure: ${new Date(flight.departureTime).toLocaleString()}`
        );
        console.log(
          `Arrival: ${new Date(flight.arrivalTime).toLocaleString()}`
        );
        console.log(`Status: ${flight.status}`);
        console.log("Full flight object:", flight);
        console.groupEnd();

        if (
          index < sortedFlights.length - 1 &&
          flight.destination !== sortedFlights[index + 1]?.source
        ) {
          // This appears to be the end of a journey
          console.groupEnd(); // End the Journey group
        } else if (index === sortedFlights.length - 1) {
          // Last flight, end the journey group
          console.groupEnd();
        }
      });

      console.groupEnd(); // End Flights group
    }

    // Log reservation information
    if (booking.reservations && booking.reservations.length > 0) {
      console.group("%cReservations", "color: orange; font-weight: bold;");
      booking.reservations.forEach((reservation, index) => {
        console.group(`Reservation ${index + 1}`);
        console.log(`Hotel: ${reservation.roomType?.hotel?.name || "Unknown"}`);
        console.log(`Room Type: ${reservation.roomType?.name || "Unknown"}`);
        console.log(
          `Check In: ${new Date(reservation.checkInDate).toLocaleDateString()}`
        );
        console.log(
          `Check Out: ${new Date(
            reservation.checkOutDate
          ).toLocaleDateString()}`
        );
        console.log(`Rooms Booked: ${reservation.roomsBooked}`);
        console.log(`Status: ${reservation.status}`);
        console.log("Full reservation object:", reservation);
        console.groupEnd();
      });
      console.groupEnd(); // End Reservations group
    }

    console.log("Raw booking data:", booking);
    console.groupEnd(); // End Booking Details group

    return booking; // Return the original booking for chaining
  };

  // Use useCallback to memoize the fetchCart function
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);

      console.log("📥 Fetching cart with status: PENDING");
      const response = await bookingAPI.getBookings({ status: "PENDING" });
      console.log(`📊 Fetched ${response?.length || 0} cart items`);

      // Detailed booking information
      if (response?.length) {
        console.group("📋 Cart Items Details");
        response.forEach((item, idx) => {
          console.log(`Item ${idx + 1}:`);
          logBookingStructure(item);
        });
        console.groupEnd();
      }

      // Process flight data to ensure all legs are properly structured
      const processedResponse = response.map((item) => {
        // If the item has flights, ensure they're properly structured for rendering
        if (item.flights && item.flights.length > 0) {
          // Sort flights by departure time to ensure correct order
          const sortedFlights = [...item.flights].sort(
            (a, b) =>
              new Date(a.departureTime).getTime() -
              new Date(b.departureTime).getTime()
          );

          // Add a special field to track multi-segment journeys
          const journeys = [];
          let currentJourney = [];
          let currentDestination = null;

          // Group flights into journeys based on connections
          for (let i = 0; i < sortedFlights.length; i++) {
            const flight = sortedFlights[i];

            if (
              currentJourney.length === 0 ||
              flight.source === currentDestination
            ) {
              // This flight connects with the previous one
              currentJourney.push(flight);
              currentDestination = flight.destination;
            } else {
              // This flight starts a new journey
              if (currentJourney.length > 0) {
                journeys.push([...currentJourney]);
                currentJourney = [flight];
                currentDestination = flight.destination;
              }
            }
          }

          // Add the last journey
          if (currentJourney.length > 0) {
            journeys.push(currentJourney);
          }

          console.log(
            `✈️ Identified ${journeys.length} distinct flight journeys in booking ${item.id}`
          );
          journeys.forEach((journey, idx) => {
            const from = journey[0].source;
            const to = journey[journey.length - 1].destination;
            console.log(
              `  Journey ${idx + 1}: ${from} → ${to} (${
                journey.length
              } segments)`
            );
          });

          // Create a deep copy to avoid modifying the original
          return {
            ...item,
            flights: sortedFlights,
            // Add the journey information as metadata
            _journeys: journeys,
          };
        }
        return item;
      });

      // Filter out any non-PENDING items just to be safe
      const pendingItems = processedResponse.filter(
        (item) => item.status === "PENDING"
      );
      console.log(`📌 Filtered to ${pendingItems.length} pending items`);

      setCart(pendingItems);
    } catch (err) {
      console.error("❌ Error fetching cart:", err);
      setError("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch cart items when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (bookingData: any): Promise<BookingItem | null> => {
    if (!isAuthenticated) return null;

    try {
      setLoading(true);
      setError(null);

      console.group("📝 Adding to cart:");
      console.log("Booking data:", bookingData);

      // Handle multiple flights for round trips properly
      if (
        bookingData.flightBooking &&
        Array.isArray(bookingData.flightBooking)
      ) {
        console.log("Multi-segment flight booking detected");
        console.log(
          `Total flight segments: ${bookingData.flightBooking.length}`
        );

        // Extract journey information
        const segments = bookingData.flightBooking;
        if (segments.length > 1) {
          const sources = segments.map((f) => f.source);
          const destinations = segments.map((f) => f.destination);

          console.log("Flight segments path:");
          segments.forEach((segment, i) => {
            console.log(
              `  ${i + 1}. ${segment.source} → ${segment.destination}`
            );
          });

          console.log(
            `Complete journey: ${segments[0].source} → ${
              segments[segments.length - 1].destination
            }`
          );
        }
      }

      const response = await bookingAPI.createBooking(bookingData);
      console.log("Response from API:", response);

      // Log detailed information about the newly created booking
      if (response && response.booking) {
        console.log("Created booking details:");
        logBookingStructure(response.booking);
      }
      console.groupEnd();

      // Add the new booking to cart
      if (response && response.booking) {
        console.log("📨 Refreshing cart to get complete booking data");
        await fetchCart();
        return response.booking;
      }
      return null;
    } catch (err) {
      console.error("❌ Error adding to cart:", err);
      setError("Failed to add item to cart");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (bookingId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      setLoading(true);
      setError(null);

      await bookingAPI.cancelBooking(bookingId);

      // Remove the booking from cart
      setCart((prevCart) => prevCart.filter((item) => item.id !== bookingId));
      return true;
    } catch (err) {
      console.error("Error removing from cart:", err);
      setError("Failed to remove item from cart");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  // Modify refreshBookings to update the bookings state
  const refreshBookings = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await fetch("/api/bookings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBookings(data); // Update bookings instead of cart
      }
    } catch (error) {
      console.error("Error refreshing bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Add cancelBooking function
  const cancelBooking = async (
    bookingId: string,
    type?: "flight" | "hotel"
  ): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      setLoading(true);
      console.log(`Cancelling booking ${bookingId}${type ? ` (${type})` : ""}`);

      // Prepare request body based on what's being cancelled
      const requestBody: {
        cancelHotelsOnly?: boolean;
        cancelFlightsOnly?: boolean;
      } = {};

      if (type === "flight") {
        requestBody.cancelFlightsOnly = true;
      } else if (type === "hotel") {
        requestBody.cancelHotelsOnly = true;
      }

      // Call your API to cancel the booking
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cancel booking failed:", errorData);
        throw new Error(errorData.error || "Failed to cancel booking");
      }

      const responseData = await response.json();
      console.log("Cancellation successful:", responseData);

      // Refresh bookings after cancellation to get updated data
      await refreshBookings();
      return true;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <BookingContext.Provider
      value={{
        cart,
        bookings,
        loading,
        error,
        fetchCart,
        addToCart,
        removeFromCart,
        clearCart,
        refreshBookings,
        cancelBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}