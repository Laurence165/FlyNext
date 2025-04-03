"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { bookingAPI } from "@/app/services/api"

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

type BookingContextType = {
  cart: CartItem[]
  bookings: Booking[]
  addToCart: (item: CartItem) => void
  removeFromCart: (type: "flight" | "hotel") => void
  clearCart: () => void
  createBooking: (paymentDetails: {
    cardNumber: string
    cardHolder: string
    expiryDate: string
    cvv: string
  }) => Promise<Booking>
  cancelBooking: (bookingId: string, type?: "flight" | "hotel") => Promise<void>
  getBookingById: (id: string) => Booking | undefined
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

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiAvailable, setApiAvailable] = useState(true)

  // Load cart from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart")
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart))
        } catch (e) {
          console.error("Failed to parse cart from localStorage", e)
          // Initialize with example items for frontend testing
          setCart(EXAMPLE_CART_ITEMS)
          localStorage.setItem("cart", JSON.stringify(EXAMPLE_CART_ITEMS))
        }
      } else {
        // Initialize with example items for frontend testing
        setCart(EXAMPLE_CART_ITEMS)
        localStorage.setItem("cart", JSON.stringify(EXAMPLE_CART_ITEMS))
      }
    }
  }, [])

  // Fetch bookings from API
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true)
      try {
        const fetchedBookings = await bookingAPI.getBookings()
        setBookings(fetchedBookings)
        setApiAvailable(true)
      } catch (error) {
        console.error("Error fetching bookings:", error)
        // Fallback to mock data if API fails
        setBookings(MOCK_BOOKINGS)
        setApiAvailable(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart))
    }
  }, [cart])

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      // Remove any existing item of the same type
      const filteredCart = prevCart.filter((cartItem) => cartItem.type !== item.type)
      // Add the new item
      return [...filteredCart, item]
    })
  }

  const removeFromCart = (type: "flight" | "hotel") => {
    setCart((prevCart) => prevCart.filter((item) => item.type !== type))
  }

  const clearCart = () => {
    setCart([])
  }

  const createBooking = async (paymentDetails: {
    cardNumber: string
    cardHolder: string
    expiryDate: string
    cvv: string
  }): Promise<Booking> => {
    try {
      // Prepare booking data from cart
      const bookingData = {
        flight: cart.find((item) => item.type === "flight")?.flight,
        hotel: cart.find((item) => item.type === "hotel")?.hotel,
        paymentDetails: {
          cardNumber: paymentDetails.cardNumber,
          cardHolder: paymentDetails.cardHolder,
          expiryDate: paymentDetails.expiryDate,
          cvv: paymentDetails.cvv,
        },
      }

      let newBooking: Booking

      if (apiAvailable) {
        // Create booking via API if available
        newBooking = await bookingAPI.createBooking(bookingData)
      } else {
        // Create mock booking if API is not available
        newBooking = {
          id: `B${'2020-01-01'}`,
          userId: "1",
          flight: bookingData.flight as FlightBooking,
          hotel: bookingData.hotel as HotelBooking,
          totalPrice: (bookingData.flight?.price || 0) + (bookingData.hotel?.totalPrice || 0),
          status: "confirmed",
          bookingDate: new Date().toISOString().split("T")[0],
          paymentMethod: "Credit Card",
          cardLastFour: paymentDetails.cardNumber.slice(-4),
        }
      }

      // Add to local bookings state
      setBookings((prev) => [...prev, newBooking])

      // Clear cart after successful booking
      clearCart()

      return newBooking
    } catch (error) {
      console.error("Error creating booking:", error)
      throw error
    }
  }

  const cancelBooking = async (bookingId: string, type?: "flight" | "hotel"): Promise<void> => {
    try {
      if (apiAvailable) {
        // Cancel booking via API if available
        await bookingAPI.cancelBooking(bookingId, type)
      }

      // Update local bookings state regardless
      setBookings((prev) => {
        return prev.map((booking) => {
          if (booking.id === bookingId) {
            if (!type) {
              // Cancel entire booking
              return { ...booking, status: "cancelled" }
            } else if (type === "flight" && booking.flight) {
              // Cancel only flight
              const updatedBooking = {
                ...booking,
                flight: undefined,
                totalPrice: booking.hotel ? booking.hotel.totalPrice : 0,
              }
              // If no hotel either, cancel the entire booking
              if (!booking.hotel) {
                updatedBooking.status = "cancelled"
              }
              return updatedBooking
            } else if (type === "hotel" && booking.hotel) {
              // Cancel only hotel
              const updatedBooking = {
                ...booking,
                hotel: undefined,
                totalPrice: booking.flight ? booking.flight.price : 0,
              }
              // If no flight either, cancel the entire booking
              if (!booking.flight) {
                updatedBooking.status = "cancelled"
              }
              return updatedBooking
            }
          }
          return booking
        })
      })
    } catch (error) {
      console.error("Error cancelling booking:", error)
      throw error
    }
  }

  const getBookingById = (id: string): Booking | undefined => {
    return bookings.find((booking) => booking.id === id)
  }

  return (
    <BookingContext.Provider
      value={{
        cart,
        bookings,
        addToCart,
        removeFromCart,
        clearCart,
        createBooking,
        cancelBooking,
        getBookingById,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}

export const useBooking = () => {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider")
  }
  return context
}

