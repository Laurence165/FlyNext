"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { bookingAPI } from "@/app/services/api"
import { useAuth } from "../auth/auth-context"

// Define the types
export type FlightBooking = {
  id: string
  flightNumber: string
  airline: string
  departureCode: string
  departureTime: string
  arrivalCode: string
  arrivalTime: string
  duration: string
  price: number
  passengers: number
  tripType: "oneWay" | "roundTrip"
  returnFlightNumber?: string
  returnAirline?: string
  returnDepartureCode?: string
  returnDepartureTime?: string
  returnArrivalCode?: string
  returnArrivalTime?: string
  returnDuration?: string
  departureDate: string
  returnDate?: string
}

export type HotelBooking = {
  id: string
  hotelId: string
  hotelName: string
  roomType: string
  checkIn: string
  checkOut: string
  nights: number
  guests: number
  pricePerNight: number
  totalPrice: number
}

export type CartItem = { type: "flight"; flight: FlightBooking } | { type: "hotel"; hotel: HotelBooking }

export type Booking = {
  id: string
  userId: string
  flight?: FlightBooking
  hotel?: HotelBooking
  totalPrice: number
  status: "confirmed" | "cancelled"
  bookingDate: string
  paymentMethod: string
  cardLastFour: string
}

type BookingItem = {
  id: string
  totalPrice: number
  status: string
  createdAt: string
  updatedAt: string
  reservations?: any[]
  flights?: any[]
}

interface BookingContextType {
  cart: BookingItem[]
  bookings: BookingItem[]
  loading: boolean
  error: string | null
  fetchCart: () => Promise<void>
  addToCart: (bookingData: any) => Promise<BookingItem | null>
  removeFromCart: (bookingId: string) => Promise<boolean>
  clearCart: () => void
  refreshBookings: () => Promise<void>
  cancelBooking: (bookingId: string, type?: "flight" | "hotel") => Promise<boolean>
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

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
]

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
]

export function BookingProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<BookingItem[]>([])
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  // Use useCallback to memoize the fetchCart function
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log("Fetching cart with status: PENDING");
      const response = await bookingAPI.getBookings({ status: 'PENDING' })
      console.log("Fetched cart items:", response);
      console.log("Cart items statuses:", response.map(item => item.status));
      
      // Filter out any non-PENDING items just to be safe
      const pendingItems = response.filter(item => item.status === "PENDING");
      console.log("Filtered pending items:", pendingItems.length);
      
      setCart(pendingItems)
    } catch (err) {
      console.error("Error fetching cart:", err)
      setError("Failed to load cart items")
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Fetch cart items when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart()
    }
  }, [isAuthenticated, fetchCart])

  const addToCart = async (bookingData: any): Promise<BookingItem | null> => {
    if (!isAuthenticated) return null
    
    try {
      setLoading(true)
      setError(null)
      
      console.log("Adding to cart:", bookingData);
      const response = await bookingAPI.createBooking(bookingData)
      console.log("Add to cart response:", response);
      
      // Add the new booking to cart
      if (response && response.booking) {
        console.log("Adding booking to cart:", response.booking);
        setCart(prevCart => [...prevCart, response.booking])
        return response.booking
      }
      return null
    } catch (err) {
      console.error("Error adding to cart:", err)
      setError("Failed to add item to cart")
      return null
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (bookingId: string): Promise<boolean> => {
    if (!isAuthenticated) return false
    
    try {
      setLoading(true)
      setError(null)
      
      await bookingAPI.cancelBooking(bookingId)
      
      // Remove the booking from cart
      setCart(prevCart => prevCart.filter(item => item.id !== bookingId))
      return true
    } catch (err) {
      console.error("Error removing from cart:", err)
      setError("Failed to remove item from cart")
      return false
    } finally {
      setLoading(false)
    }
  }

  const clearCart = () => {
    setCart([])
  }

  // Modify refreshBookings to update the bookings state
  const refreshBookings = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookings(data); // Update bookings instead of cart
      }
    } catch (error) {
      console.error('Error refreshing bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Add cancelBooking function
  const cancelBooking = async (bookingId: string, type?: "flight" | "hotel"): Promise<boolean> => {
    if (!isAuthenticated) return false;
    
    try {
      setLoading(true);
      // Call your API to cancel the booking
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type })
      });
      
      if (response.ok) {
        // Refresh bookings after cancellation
        await refreshBookings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <BookingContext.Provider value={{ 
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
    }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider")
  }
  return context
}

