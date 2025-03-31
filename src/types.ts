export enum Role {
    USER = "USER",
    HOTEL_OWNER = "HOTEL_OWNER",
  }
  
  export enum ReservationStatus {
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
  }
  
  export enum BookingStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    CANCELLED = "CANCELLED",
  }
  
  export enum NotificationType {
    BOOKING_CONFIRMED = "BOOKING_CONFIRMED",
    BOOKING_CANCELLED = "BOOKING_CANCELLED",
    HOTEL_BOOKING = "HOTEL_BOOKING",
    FLIGHT_CHANGE = "FLIGHT_CHANGE",
  }
  
  // ===================== Entities ===================== //
  
  export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    profilePic?: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  
    hotels: Hotel[];
    bookings: Booking[];
    notifications: Notification[];
  }
  
  export interface Hotel {
    id: string;
    name: string;
    logo?: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    starRating: number;
    createdAt: Date;
    updatedAt: Date;
  
    ownerId: string;
    owner: User;
    roomTypes: RoomType[];
    images: HotelImage[];
  }
  
  export interface HotelImage {
    id: string;
    url: string;
    hotelId: string;
    hotel: Hotel;
  }
  
  export interface RoomType {
    id: string;
    hotelId: string;
    hotel: Hotel;
    name: string;
    pricePerNight: number;
    totalRooms: number;
  
    amenities: Amenity[];
    images: RoomTypeImage[];
    roomAvailability: RoomAvailability[];
    reservations: Reservation[];
  }
  
  export interface Amenity {
    id: string;
    roomTypeId: string;
    roomType: RoomType;
    amenity: string;
  }
  
  export interface RoomTypeImage {
    id: string;
    roomTypeId: string;
    roomType: RoomType;
    imageUrl: string;
  }
  
  export interface RoomAvailability {
    id: string;
    roomTypeId: string;
    roomType: RoomType;
    date: Date;
    availableRooms: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Reservation {
    id: string;
    roomTypeId: string;
    roomType: RoomType;
    checkInDate: Date;
    checkOutDate: Date;
    roomsBooked: number;
    status: ReservationStatus;
    createdAt: Date;
    updatedAt: Date;
  
    bookingId: string;
    booking: Booking;
  }
  
  export interface Booking {
    id: string;
    totalPrice: number;
    status: BookingStatus;
    createdAt: Date;
    updatedAt: Date;
  
    userId: string;
    user: User;
    reservations: Reservation[];
    flights: Flight[];
    invoice?: Invoice;
  }
  
  export interface Flight {
    id: string;
    afsFlightId: string;
    departureTime: Date;
    arrivalTime: Date;
    source: string;
    destination: string;
    status: ReservationStatus;
    createdAt: Date;
    updatedAt: Date;
  
    bookingId: string;
    booking: Booking;
  }
  
  export interface Invoice {
    id: string;
    pdfPath: string;
    createdAt: Date;
  
    bookingId: string;
    booking: Booking;
  }
  
  export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    read: boolean;
    createdAt: Date;
  
    userId: string;
    user: User;
  }
  
  export interface City {
    id: string;
    name: string;
    country: string;
    createdAt: Date;
    updatedAt: Date;
  
    airports: Airport[];
  }
  
  export interface Airport {
    id: string;
    code: string;
    name: string;
    cityId: string;
    city: City;
    country: string;
    afsId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Airline {
    id: string;
    code: string;
    name: string;
    baseAirport: string;
    createdAt: Date;
    updatedAt: Date;
  }
  