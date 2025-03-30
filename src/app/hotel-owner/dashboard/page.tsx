"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Hotel, Calendar, Users, CreditCard, Percent, TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/app/components/auth/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HotelOwnerDashboard() {
  const { user, isHotelOwner, isLoading } = useAuth()
  const router = useRouter()

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isHotelOwner) {
      router.push("/login");
    }
  }, [mounted, isLoading, isHotelOwner, router]);

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
            <div className="text-2xl font-bold">127</div>
          </CardContent>
        </Card>
        
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancellations</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
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
              <CardDescription>Bookings for the next 7 days</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t">
                {mockBookings.length > 0 ? (
                  <div className="divide-y">
                    {mockBookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{booking.guestName}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.roomType} • {booking.checkIn} to {booking.checkOut}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${booking.totalAmount}</p>
                          <p className="text-xs text-muted-foreground">{booking.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">No upcoming bookings</div>
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
                      <div key={roomType.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium">{roomType.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {roomType.availableRooms} of {roomType.totalRooms} available
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${roomType.pricePerNight}/night</p>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/hotel-owner/rooms/${roomType.id}`}>Manage</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">No room types defined</div>
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
  },
  {
    id: "2",
    name: "Executive Suite",
    availableRooms: 3,
    totalRooms: 5,
    pricePerNight: 300,
  },
  {
    id: "3",
    name: "Twin Room",
    availableRooms: 12,
    totalRooms: 15,
    pricePerNight: 120,
  },
  {
    id: "4",
    name: "Family Room",
    availableRooms: 4,
    totalRooms: 8,
    pricePerNight: 200,
  },
]

