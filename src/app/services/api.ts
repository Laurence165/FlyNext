// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "/api";
import axios from "axios"

import { Hotel, AddRoomType } from "@/types"
// Generic fetch function with improved error handling
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  const url = `${API_BASE_URL}${endpoint}`
  if (token !== null) console.log("token exist")

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    // Handle 403 Unauthorized
    if (response.status === 403) {
      // Clear the token
      localStorage.removeItem("token")
      // Redirect to login
      window.location.href = "/login"
      throw new Error("Unauthorized access. Please log in again.")
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      return {} as T
    }

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
      
      // Specific room type full error handling
      if (error.message && error.message.includes("room type is full")) {
        throw new Error("This room type is full for the selected dates. Please choose another room or date.")
      }

      throw new Error(error.message || `API Error: ${response.status} ${response.statusText}`)
    }

    // For endpoints that return no content
    if (response.status === 204) {
      return {} as T
    }

    // Handle non-JSON successful responses
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
  getBookings: async (params: { status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.status) {
      queryParams.append('status', params.status);
    }
    
    const response = await fetch(`${API_BASE_URL}/bookings?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    
    return response.json();
  },

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
    hotelBooking?: {
      hotelId: string,
      roomTypeId: string,
      checkInDate: string
      checkOutDate: string
      roomsRequested: number
      price: number
  
    }
    totalPrice: number
  }) => {
    console.log("Creating booking with data:", bookingData);
    return fetchAPI<any>("/bookings", {
      method: "POST",
      body: JSON.stringify(bookingData),
    });
  },

  cancelBooking: (id: string, type?: "flight" | "hotel") =>
    fetchAPI<any>(`/bookings/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({ type }),
    }),
}

// Hotel API
export const hotelAPI = {
  getHotels: async (filters: {
    city?: string;
    minStarRating?: number;
    checkIn?: string;
    checkOut?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    const queryParams = new URLSearchParams();
    console.log("MIN PRICE" + filters.minPrice)

    if (filters.city) queryParams.append('city', filters.city);
    if (filters.minStarRating) queryParams.append('minStarRating', filters.minStarRating.toString());
    if (filters.checkIn) queryParams.append('checkIn', filters.checkIn);
    if (filters.checkOut) queryParams.append('checkOut', filters.checkOut);
    if (filters.minPrice) queryParams.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice.toString());
    console.log(queryParams)
    return fetchAPI(`/hotels?${queryParams.toString()}`);
  },

  getHotelById: (id: string) => fetchAPI<any>(`/hotels/${id}`),
  updateHotelById: (id: string, hotelData: any) => fetchAPI(`/hotels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(hotelData),
  }),

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

  getMyHotels: () => fetchAPI<Hotel[]>('/hotels/my-hotels'),

  deleteHotels: async (id: string) => {
    return fetchAPI(`/hotels`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  },
    
  //updateHotel: () => fetchAPI<Hotel[]>

  addRoomTypes: (hotelId: string, roomType: AddRoomType) => 
    fetchAPI<any>(`/hotels/${hotelId}/roomTypes`, {
      method: 'POST',
      body: JSON.stringify({
        name: roomType.name,
        pricePerNight: roomType.pricePerNight,
        amenities: roomType.amenities,
        images: roomType.images,
        totalRooms: roomType.totalRooms
      }),
    }),

  getAllRoomTypes: (hotelId: string) => 
    fetchAPI<AddRoomType[]>(`/hotels/${hotelId}/roomTypes`),

  editRoomTypesByID: (hotelId: string, roomTypeId: string, roomType: AddRoomType) => 
    fetchAPI<AddRoomType>(`/hotels/${hotelId}/roomTypes/${roomTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(roomType),
    }),

  deleteRoomTypesByID: (hotelId: string, roomTypeId: string) => 
    fetchAPI<void>(`/hotels/${hotelId}/roomTypes/${roomTypeId}`, {
      method: 'DELETE',
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

export const createHotelAPI = {
  createHotel: async (hotelData: any) => {
    const hotelDataWithLocation = {
      ...hotelData,
      latitude: 0,
      longitude: 0
    }
    
    return fetchAPI('/hotels', {
      method: 'POST',
      body: JSON.stringify(hotelDataWithLocation),
    });
  },
};

// Profile API
export const profileAPI = {
  // ... existing profile methods ...

  uploadProfileImage: async (formData: FormData) => {

    //const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    const response = await fetch(`${API_BASE_URL}/auth/upload-images`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Upload failed: ${response.statusText}`)
    }

    return response
  },
}

