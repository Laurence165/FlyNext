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

  createBooking: (bookingData: any) =>
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
  getHotels: (params?: any) => {
    const queryParams = params ? new URLSearchParams(params).toString() : ""
    return fetchAPI<any[]>(`/hotels${queryParams ? `?${queryParams}` : ""}`)
  },

  getHotelById: (id: string) => fetchAPI<any>(`/hotels/${id}`),

  getFeaturedHotels: async () => {
    try {
      return await fetchAPI<any[]>("/hotels/featured")
    } catch (error) {
      console.error("Error in getFeaturedHotels:", error)
      // Return empty array instead of throwing to make it easier to handle
      return []
    }
  },
}

// Flight API
export const flightAPI = {
  searchFlights: (params: any) => {
    const queryParams = new URLSearchParams(params).toString()
    return fetchAPI<any[]>(`/flights/search?${queryParams}`)
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
      return await fetchAPI<void>(`/notifications/${id}/read`, {
        method: "POST",
      })
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error)
      // Return empty object instead of throwing
      return {}
    }
  },

  markAllAsRead: async () => {
    try {
      return await fetchAPI<void>("/notifications/read-all", {
        method: "POST",
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      // Return empty object instead of throwing
      return {}
    }
  },
}

