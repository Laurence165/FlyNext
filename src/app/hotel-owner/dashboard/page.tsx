"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Hotel, Calendar, Users, CreditCard, Percent, TrendingUp, Loader2 } from "lucide-react"
import { DateRange } from "react-day-picker"
import { addDays, format, isWithinInterval, parseISO } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRangePicker } from "@/components/date-range-picker"
import Image from "next/image"
import { ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/app/components/auth/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { bookingAPI } from "@/app/services/api"
import { useToast } from "@/components/ui/use-toast"

// Add interface for booking type
interface Booking {
  id: string
  totalPrice: number
  status: string
  createdAt: string
  updatedAt: string
  userId: string
  reservations: {
    id: string
    roomTypeId: string
    checkInDate: string
    checkOutDate: string
    roomsBooked: number
    status: string
    roomType: {
      name: string
      pricePerNight: number
      hotel: {
        name: string
      }
    }
  }[]
}

interface RoomType {
  id: string
  name: string
  availableRooms: number
  totalRooms: number
  pricePerNight: number
  amenities: { amenity: string }[]
  images: { imageUrl: string }[]
}

export default function HotelOwnerDashboard() {
  const { user, isHotelOwner, isLoading } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 30), // Default to next 30 days
  })
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const { toast } = useToast()
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // Fetch real bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await bookingAPI.getHotelBookings()
        setBookings(data)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setBookingsLoading(false)
      }
    }

    if (isHotelOwner) {
      fetchBookings()
    }
  }, [isHotelOwner])

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isHotelOwner) {
      router.push("/login");
    }
  }, [mounted, isLoading, isHotelOwner, router]);

  // Filter bookings based on date range and status
  const filteredBookings = bookings.filter(booking => {
    const checkIn = parseISO(booking.reservations[0]?.checkInDate)
    
    // Date range filter
    const isInDateRange = dateRange?.from && dateRange?.to
      ? isWithinInterval(checkIn, { start: dateRange.from, end: dateRange.to })
      : true

    // Status filter
    const matchesStatus = filterStatus === "all" 
      ? true 
      : booking.status === filterStatus

    return isInDateRange && matchesStatus
  })

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancellingId(bookingId)
      await bookingAPI.cancelBooking(bookingId)
      
      // Update local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'CANCELLED' }
            : booking
        )
      )

      toast({
        title: "Booking Cancelled",
        description: "The booking has been successfully cancelled.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCancellingId(null)
    }
  }

  // Calculate booking stats
  const bookingStats = {
    totalBookings: bookings.length,
    cancellations: bookings.filter(booking => booking.status === 'CANCELLED').length,
    confirmedBookings: bookings.filter(booking => booking.status === 'CONFIRMED').length,
    pendingBookings: bookings.filter(booking => booking.status === 'PENDING').length,
  }

  if (!mounted || isLoading) return null; // or a loader

  if (!user || !isHotelOwner) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hotel Owner Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.firstName}! Manage your hotels and bookings.</p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/hotel-owner/hotels/add">
            <Hotel className="mr-2 h-4 w-4" />
            Add New Hotel
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStats.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bookingStats.confirmedBookings} confirmed, {bookingStats.pendingBookings} pending
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellations</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStats.cancellations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((bookingStats.cancellations / bookingStats.totalBookings) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Bookings</TabsTrigger>
          <TabsTrigger value="availability">Room Availability</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>Recent bookings for your hotels</CardDescription>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <DateRangePicker
                  date={dateRange}
                  onDateChange={setDateRange}
                />
                <select
                  className="h-10 rounded-md border border-input px-3"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                {bookingsLoading ? (
                  <div className="p-4 text-center">Loading bookings...</div>
                ) : filteredBookings.length > 0 ? (
                  <div className="divide-y">
                    {filteredBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{booking.reservations[0]?.roomType.hotel.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.reservations[0]?.roomType.name} • {new Date(booking.reservations[0]?.checkInDate).toLocaleDateString()} to{' '}
                            {new Date(booking.reservations[0]?.checkOutDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Rooms: {booking.reservations[0]?.roomsBooked}
                          </p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="font-medium">${booking.totalPrice}</p>
                          <p className={`text-xs ${
                            booking.status === 'CANCELLED' ? 'text-red-500' : 'text-green-500'
                          }`}>
                            {booking.status}
                          </p>
                          {booking.status === 'CONFIRMED' && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={cancellingId === booking.id}
                            >
                              {cancellingId === booking.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Cancelling...
                                </>
                              ) : (
                                'Cancel Booking'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No bookings found for the selected date range
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Room Availability</CardTitle>
              <CardDescription>Current availability</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                {mockRoomTypes.length > 0 ? (
                  <div className="divide-y">
                    {mockRoomTypes.map((roomType) => (
                      <div key={roomType.id} className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Images Carousel */}
                          <div className="w-full md:w-1/3 relative">
                            <div className="aspect-video relative rounded-lg overflow-hidden">
                              {roomType.images && roomType.images.length > 0 ? (
                                <Image
                                  src={roomType.images[0].imageUrl}
                                  alt={roomType.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Room Details */}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-medium text-lg">{roomType.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {roomType.availableRooms} of {roomType.totalRooms} available
                                </p>
                              </div>
                              <p className="font-medium">${roomType.pricePerNight}/night</p>
                            </div>

                            {/* Amenities */}
                            {roomType.amenities && roomType.amenities.length > 0 && (
                              <div className="mt-2">
                                <p className="text-sm font-medium mb-1">Amenities:</p>
                                <div className="flex flex-wrap gap-2">
                                  {roomType.amenities.map((amenity, index) => (
                                    <Badge key={index} variant="secondary">
                                      {amenity.amenity}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="mt-4 flex justify-end">
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/hotel-owner/rooms/${roomType.id}`}>
                                  Manage Room
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No room types defined
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Mock data
const mockBookings = [
  {
    id: "1",
    guestName: "Alice Johnson",
    roomType: "Deluxe Double",
    checkIn: "May 15, 2023",
    checkOut: "May 18, 2023",
    totalAmount: 450,
    status: "Confirmed",
  },
  {
    id: "2",
    guestName: "Bob Smith",
    roomType: "Executive Suite",
    checkIn: "May 16, 2023",
    checkOut: "May 20, 2023",
    totalAmount: 1200,
    status: "Confirmed",
  },
  {
    id: "3",
    guestName: "Carol Davis",
    roomType: "Twin Room",
    checkIn: "May 17, 2023",
    checkOut: "May 19, 2023",
    totalAmount: 320,
    status: "Pending",
  },
]

const mockRoomTypes = [
  {
    id: "1",
    name: "Deluxe Double",
    availableRooms: 8,
    totalRooms: 10,
    pricePerNight: 150,
    amenities: [],
    images: [],
  },
  {
    id: "2",
    name: "Executive Suite",
    availableRooms: 3,
    totalRooms: 5,
    pricePerNight: 300,
    amenities: [],
    images: [],
  },
  {
    id: "3",
    name: "Twin Room",
    availableRooms: 12,
    totalRooms: 15,
    pricePerNight: 120,
    amenities: [],
    images: [],
  },
  {
    id: "4",
    name: "Family Room",
    availableRooms: 4,
    totalRooms: 8,
    pricePerNight: 200,
    amenities: [],
    images: [],
  },
]

