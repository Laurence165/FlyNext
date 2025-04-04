// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "/api";
import axios from "axios";

import { Hotel, AddRoomType } from "@/types";

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

async function refreshToken() {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token available");

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) throw new Error("Token refresh failed");

    const data = await response.json();
    localStorage.setItem("token", data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }
    return data.accessToken;
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
    throw error;
  }
}

interface HotelWithRoomTypes {
  id: string;
  name: string;
  logo?: string;
  roomTypes: {
    id: string;
    name: string;
    pricePerNight: number;
    totalRooms: number;
    availableRooms: number;
    amenities: { amenity: string }[];
    images: { imageUrl: string }[];
  }[];
}

// Generic fetch function with improved error handling
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const executeRequest = async (accessToken: string | null): Promise<T> => {
    const defaultHeaders = {
      "Content-Type": "application/json",
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await refreshToken();
            isRefreshing = false;
            processQueue(null, newToken);
            // Retry the original request with new token
            return executeRequest(newToken);
          } catch (error) {
            processQueue(error, null);
            console.error("Token refresh failed:", error); // Log the error
            throw error;
          }
        } else {
          // Wait for the refresh to complete
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((): Promise<T> => {
            return executeRequest(localStorage.getItem('token'));
          });
        }
      }

      // Handle other responses
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        const isJson = contentType && contentType.includes("application/json");

        if (!isJson) {
          const errorMessage = `API Error: Endpoint ${endpoint} returned non-JSON response`;
          console.error(errorMessage); // Log non-JSON error
          throw new Error(errorMessage);
        }

        const error = await response.json();
        const errorMessage = error.message || `API Error: ${response.status} ${response.statusText}`;
        console.error(errorMessage, error); // Log detailed error
        throw new Error(errorMessage);
      }

      return response.json();
    } catch (error) {
      // Catch any error during the fetch or response handling and log it
      console.error("Fetch API Error:", error);
      throw error; // Rethrow the error after logging
    }
  };

  return executeRequest(token);
}


// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    fetchAPI<{ user: any; accessToken: string; refreshToken: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }
    ),

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
};

// Booking API
export const bookingAPI = {
  getBookings: async (params: { status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.status) {
      queryParams.append("status", params.status);
    }

    const response = await fetch(
      `${API_BASE_URL}/bookings?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch bookings");
    }

    return response.json();
  },
  getHotelBookings: () => fetchAPI<any>("/bookings/getHotelBookings"),

  getBookingById: (id: string) => fetchAPI<any>(`/bookings/${id}`),

  createBooking: (bookingData: {
    flightBooking?: {
      afsFlightId: string;
      departureTime: string;
      arrivalTime: string;
      source: string;
      destination: string;
      price: number;
    }[];
    hotelBooking?: {
      hotelId: string;
      roomTypeId: string;
      checkInDate: string;
      checkOutDate: string;
      roomsRequested: number;
      price: number;
    };
    totalPrice: number;
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
};

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
    console.log("MIN PRICE" + filters.minPrice);

    if (filters.city) queryParams.append("city", filters.city);
    if (filters.minStarRating)
      queryParams.append("minStarRating", filters.minStarRating.toString());
    if (filters.checkIn) queryParams.append("checkIn", filters.checkIn);
    if (filters.checkOut) queryParams.append("checkOut", filters.checkOut);
    if (filters.minPrice)
      queryParams.append("minPrice", filters.minPrice.toString());
    if (filters.maxPrice)
      queryParams.append("maxPrice", filters.maxPrice.toString());
    console.log(queryParams);
    return fetchAPI(`/hotels?${queryParams.toString()}`);
  },

  getHotelById: (id: string) => fetchAPI<any>(`/hotels/${id}`),
  updateHotelById: (id: string, hotelData: any) =>
    fetchAPI(`/hotels/${id}`, {
      method: "PUT",
      body: JSON.stringify(hotelData),
    }),

  getFeaturedHotels: () => fetchAPI<any[]>("/hotels"),

  bookHotel: (bookingData: {
    hotelId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    roomTypeId: string;
  }) =>
    fetchAPI<any>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        hotelBooking: bookingData,
        totalPrice: 0, // This will be calculated on the server
      }),
    }),

  getMyHotels: () => fetchAPI<Hotel[]>("/hotels/my-hotels"),

  deleteHotels: async (id: string) => {
    return fetchAPI(`/hotels`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
  },

  //updateHotel: () => fetchAPI<Hotel[]>

  addRoomTypes: (hotelId: string, roomType: AddRoomType) =>
    fetchAPI<any>(`/hotels/${hotelId}/roomTypes`, {
      method: "POST",
      body: JSON.stringify({
        name: roomType.name,
        pricePerNight: roomType.pricePerNight,
        amenities: roomType.amenities,
        images: roomType.images,
        totalRooms: roomType.totalRooms,
      }),
    }),

  getAllRoomTypes: (hotelId: string) =>
    fetchAPI<AddRoomType[]>(`/hotels/${hotelId}/roomTypes`),

  editRoomTypesByID: (
    hotelId: string,
    roomTypeId: string,
    roomType: AddRoomType
  ) =>
    fetchAPI<AddRoomType>(`/hotels/${hotelId}/roomTypes/${roomTypeId}`, {
      method: "PUT",
      body: JSON.stringify(roomType),
    }),

  deleteRoomTypesByID: (hotelId: string, roomTypeId: string) =>
    fetchAPI<void>(`/hotels/${hotelId}/roomTypes/${roomTypeId}`, {
      method: "DELETE",
    }),

  getAllHotelOwnerRoomTypes: (date?: string) => 
    fetchAPI<HotelWithRoomTypes[]>(`/bookings/getAllRoomTypes${date ? `?date=${date}` : ''}`),
};

// Flight API
export const flightAPI = {
  searchFlights: async (params: {
    origin: string;
    destination: string;
    date?: string;
    departDate?: string;
    returnDate?: string;
  }) => {
    // Check if it's a round trip search
    if (params.departDate && params.returnDate) {
      const queryParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        departDate: params.departDate,
        returnDate: params.returnDate,
      }).toString();
      return fetchAPI<{ outbound: any[]; return: any[] }>(
        `/flights/roundtrip?${queryParams}`
      );
    } else {
      // One-way search
      const queryParams = new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        date: params.date || params.departDate!,
      }).toString();
      return fetchAPI<{ results: any[] }>(`/flights/search?${queryParams}`);
    }
  },

  getFlightById: (id: string) => fetchAPI<any>(`/flights/${id}`),
};

// Notification API
export const notificationAPI = {
  getNotifications: async () => {
    try {
      return await fetchAPI<any[]>("/notifications");
    } catch (error) {
      console.error("Error in getNotifications:", error);
      // Return empty array instead of throwing to make it easier to handle
      return [];
    }
  },

  markAsRead: async (id: string) => {
    try {
      return await fetchAPI<void>(`/notifications/${id}`, {
        method: "PUT",
      });
    } catch (error) {
      console.error(`Error marking notification ${id} as read:`, error);
      // Return empty object instead of throwing
      return {};
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
};

// Checkout API
export const checkoutAPI = {
  processPayment: (paymentData: {
    bookingId: string;
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    cvv: string;
  }) => {
    return fetchAPI<{
      success: boolean;
      message: string;
      booking: {
        id: string;
        status: string;
        totalPrice: number;
      };
      invoice: {
        id: string;
        pdfPath: string;
      };
    }>("/checkout", {
      method: "POST",
      body: JSON.stringify(paymentData),
    });
  },
};

export const createHotelAPI = {
  createHotel: async (hotelData: any) => {
    const hotelDataWithLocation = {
      ...hotelData,
      latitude: 0,
      longitude: 0,
    };
    console.log(hotelDataWithLocation);
    return fetchAPI("/hotels", {
      method: "POST",
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
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Upload failed: ${response.statusText}`
      );
    }

    return response;
  },
};
