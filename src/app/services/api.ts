// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api" //|| "/api"
import axios from "axios"

// Generic fetch function with improved error handling
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {


  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  const url = `${API_BASE_URL}${endpoint}`


  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    // Check if the response is JSON
    const contentType = response.headers.get("content-type")
    const isJson = contentType && contentType.includes("application/json")

    if (!response.ok) {
      // Handle non-JSON responses
      if (!isJson) {
        console.error(`API Error: Non-JSON response from ${url}`)
        throw new Error(`API Error: Endpoint ${endpoint} returned non-JSON response`)
      }

      // Handle JSON error responses
      const error = await response.json()
      throw new Error(error.message || `API Error: ${response.status} ${response.statusText}`)
    }

    // For endpoints that return no content
    if (response.status === 204) {
      return {} as T
    }

    // Handle non-JSON successful responses (should not happen, but just in case)
    if (!isJson) {
      console.warn(`API Warning: Expected JSON but got non-JSON response from ${url}`)
      return {} as T
    }

    return await response.json()
  } catch (error) {
    // Enhance error with endpoint information
    if (error instanceof Error) {
      error.message = `API Error (${endpoint}): ${error.message}`
    }
    throw error
  }
}

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    fetchAPI<{ user: any; accessToken: string; refreshToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  signup: (userData: any) =>
    fetchAPI<{ user: any; token: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  getProfile: () => fetchAPI<{ user: any }>("/users/me"),

  updateProfile: (userData: any) =>
    fetchAPI<{ user: any }>("/users/me", {
      method: "PUT",
      body: JSON.stringify(userData),
    }),
}

// Booking API
export const bookingAPI = {
  getBookings: () => fetchAPI<any[]>("/bookings"),

  getBookingById: (id: string) => fetchAPI<any>(`/bookings/${id}`),

  createBooking: (bookingData: {
    flightBooking?: {
      afsFlightId: string
      departureTime: string
      arrivalTime: string
      source: string
      destination: string
      price: number
    }[]
    hotelBooking?: any
    totalPrice: number
  }) =>
    fetchAPI<any>("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    }),

  cancelBooking: (id: string, type?: "flight" | "hotel") =>
    fetchAPI<any>(`/bookings/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
}

// Hotel API
export const hotelAPI = {
  getHotels: (params?: {
    city?: string
    checkIn?: string
    checkOut?: string
    guests?: string
    minPrice?: string
    maxPrice?: string
    minStarRating?: string
    maxStarRating?: string
  }) => {
    // Build query string to match existing API route expectations
    const searchParams = new URLSearchParams()
    
    if (params) {
      // Only add parameters that are defined
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value)
        }
      })
    }
    
    return fetchAPI<any[]>(`/hotels${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)
  },

  getHotelById: (id: string) => fetchAPI<any>(`/hotels/${id}`),

  getFeaturedHotels: () => fetchAPI<any[]>("/hotels"),

  bookHotel: (bookingData: {
    hotelId: string
    checkIn: string
    checkOut: string
    guests: number
    roomTypeId: string
  }) => 
    fetchAPI<any>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        hotelBooking: bookingData,
        totalPrice: 0, // This will be calculated on the server
      }),
    }),
}

// Flight API
export const flightAPI = {
  searchFlights: async (params: {
    origin: string
    destination: string
    date?: string
    departDate?: string
    returnDate?: string
  }) => {
    // Check if it's a round trip search
    if (params.departDate && params.returnDate) {
      const queryParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        departDate: params.departDate,
        returnDate: params.returnDate
      }).toString()
      return fetchAPI<{ outbound: any[], return: any[] }>(`/flights/roundtrip?${queryParams}`)
    } else {
      // One-way search
      const queryParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        date: params.date || params.departDate!
      }).toString()
      return fetchAPI<{ results: any[] }>(`/flights/search?${queryParams}`)
    }
  },

  getFlightById: (id: string) => fetchAPI<any>(`/flights/${id}`),
}

// Notification API
export const notificationAPI = {
  getNotifications: async () => {
    try {
      return await fetchAPI<any[]>("/notifications")
    } catch (error) {
      console.error("Error in getNotifications:", error)
      // Return empty array instead of throwing to make it easier to handle
      return []
    }
  },

  markAsRead: async (id: string) => {
    try {
      return await fetchAPI<void>(`/notifications/${id}`, {
        method: "PUT",
      })
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error)
      // Return empty object instead of throwing
      return {}
    }
  },

  // markAllAsRead: async () => {
  //   try {
  //     return await fetchAPI<void>("/notifications/read-all", {
  //       method: "POST",
  //     })
  //   } catch (error) {
  //     console.error("Error marking all notifications as read:", error)
  //     // Return empty object instead of throwing
  //     return {}
  //   }
  // },
}

// Checkout API
export const checkoutAPI = {
  processPayment: (paymentData: {
    bookingId: string
    cardNumber: string
    cardholderName: string
    expiryDate: string
    cvv: string
  }) => {
    return fetchAPI<{
      success: boolean
      message: string
      booking: {
        id: string
        status: string
        totalPrice: number
      }
      invoice: {
        id: string
        pdfPath: string
      }
    }>("/checkout", {
      method: "POST",
      body: JSON.stringify(paymentData),
    })
  }
}

