"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Filter, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/app/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

export default function BookingsList() {
  const { user, isHotelOwner, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [bookings, setBookings] = useState(mockBookings)
  const [selectedBooking, setSelectedBooking] = useState<(typeof mockBookings)[0] | null>(null)
  const [filterDate, setFilterDate] = useState<Date>()
  const [filterRoomType, setFilterRoomType] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== "undefined" && !isLoading) {
      if (!isHotelOwner) {
        router.push("/login")
      }
    }
  }, [isHotelOwner, router, isLoading])

  const handleCancelBooking = (bookingId: string) => {
    // TODO: call an API to cancel the booking
    setBookings((prev) =>
      prev.map((booking) => (booking.id === bookingId ? { ...booking, status: "Cancelled" } : booking)),
    )

    toast({
      title: "Booking cancelled",
      description: "The booking has been cancelled successfully",
    })
  }

  const applyFilters = () => {
    let filtered = [...mockBookings]

    // Apply room type filter
    if (filterRoomType) {
      filtered = filtered.filter((booking) => booking.roomType === filterRoomType)
    }

    // Apply date filter
    if (filterDate) {
      const filterDateStr = format(filterDate, "MMM d, yyyy")
      filtered = filtered.filter((booking) => booking.checkIn === filterDateStr || booking.checkOut === filterDateStr)
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (booking) => booking.guestName.toLowerCase().includes(query) || booking.id.toLowerCase().includes(query),
      )
    }

    setBookings(filtered)
    setIsFilterOpen(false)
  }

  const clearFilters = () => {
    setFilterDate(undefined)
    setFilterRoomType("")
    setSearchQuery("")
    setBookings(mockBookings)
    setIsFilterOpen(false)
  }

  if (!user || !isHotelOwner) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage your hotel bookings</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by guest or booking ID"
              className="pl-8 w-full sm:w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            />
          </div>
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filter Bookings</h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Room Type</label>
                  <Select value={filterRoomType} onValueChange={setFilterRoomType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All room types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All room types</SelectItem>
                      <SelectItem value="Deluxe Double">Deluxe Double</SelectItem>
                      <SelectItem value="Executive Suite">Executive Suite</SelectItem>
                      <SelectItem value="Twin Room">Twin Room</SelectItem>
                      <SelectItem value="Family Room">Family Room</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {filterDate ? format(filterDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent mode="single" selected={filterDate} onSelect={setFilterDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                  <Button size="sm" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>View and manage all bookings for your hotels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-8 gap-4 p-4 font-medium border-b bg-muted/50">
              <div className="col-span-2">Guest</div>
              <div className="col-span-2">Room Details</div>
              <div className="col-span-2">Dates</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-1">Status</div>
            </div>
            <div className="divide-y">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <div key={booking.id} className="grid grid-cols-8 gap-4 p-4 items-center">
                    <div className="col-span-2">
                      <p className="font-medium">{booking.guestName}</p>
                      <p className="text-xs text-muted-foreground">Booking #{booking.id}</p>
                    </div>
                    <div className="col-span-2">
                      <p>{booking.roomType}</p>
                      <p className="text-xs text-muted-foreground">{booking.hotelName}</p>
                    </div>
                    <div className="col-span-2">
                      <p>
                        {booking.checkIn} - {booking.checkOut}
                      </p>
                      <p className="text-xs text-muted-foreground">{booking.nights} nights</p>
                    </div>
                    <div className="col-span-1">
                      <p className="font-medium">${booking.totalAmount}</p>
                    </div>
                    <div className="col-span-1 flex items-center justify-between">
                      <Badge
                        variant={
                          booking.status === "Confirmed"
                            ? "default"
                            : booking.status === "Pending"
                              ? "outline"
                              : "destructive"
                        }
                      >
                        {booking.status}
                      </Badge>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="19" cy="12" r="1" />
                              <circle cx="5" cy="12" r="1" />
                            </svg>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Booking Details</DialogTitle>
                            <DialogDescription>Booking #{selectedBooking?.id}</DialogDescription>
                          </DialogHeader>
                          {selectedBooking && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Guest</h4>
                                  <p>{selectedBooking.guestName}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                                  <Badge
                                    variant={
                                      selectedBooking.status === "Confirmed"
                                        ? "default"
                                        : selectedBooking.status === "Pending"
                                          ? "outline"
                                          : "destructive"
                                    }
                                  >
                                    {selectedBooking.status}
                                  </Badge>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Check-in</h4>
                                  <p>{selectedBooking.checkIn}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Check-out</h4>
                                  <p>{selectedBooking.checkOut}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Room Type</h4>
                                  <p>{selectedBooking.roomType}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Hotel</h4>
                                  <p>{selectedBooking.hotelName}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Nights</h4>
                                  <p>{selectedBooking.nights}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Total Amount</h4>
                                  <p className="font-medium">${selectedBooking.totalAmount}</p>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">Special Requests</h4>
                                <p className="text-sm">{selectedBooking.specialRequests || "No special requests"}</p>
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            {selectedBooking && selectedBooking.status !== "Cancelled" && (
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  handleCancelBooking(selectedBooking.id)
                                  setSelectedBooking(null)
                                }}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel Booking
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">No bookings found</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Mock data
const mockBookings = [
  {
    id: "B12345",
    guestName: "Alice Johnson",
    hotelName: "Grand Hotel",
    roomType: "Deluxe Double",
    checkIn: "May 15, 2023",
    checkOut: "May 18, 2023",
    nights: 3,
    totalAmount: 450,
    status: "Confirmed",
    specialRequests: "Late check-in, around 10 PM",
  },
  {
    id: "B12346",
    guestName: "Bob Smith",
    hotelName: "Grand Hotel",
    roomType: "Executive Suite",
    checkIn: "May 16, 2023",
    checkOut: "May 20, 2023",
    nights: 4,
    totalAmount: 1200,
    status: "Confirmed",
    specialRequests: "High floor with city view if possible",
  },
  {
    id: "B12347",
    guestName: "Carol Davis",
    hotelName: "Seaside Resort",
    roomType: "Twin Room",
    checkIn: "May 17, 2023",
    checkOut: "May 19, 2023",
    nights: 2,
    totalAmount: 320,
    status: "Pending",
    specialRequests: "",
  },
  {
    id: "B12348",
    guestName: "David Wilson",
    hotelName: "Grand Hotel",
    roomType: "Family Room",
    checkIn: "May 20, 2023",
    checkOut: "May 25, 2023",
    nights: 5,
    totalAmount: 1000,
    status: "Confirmed",
    specialRequests: "Need extra bed for child",
  },
  {
    id: "B12349",
    guestName: "Emma Brown",
    hotelName: "Seaside Resort",
    roomType: "Deluxe Double",
    checkIn: "May 18, 2023",
    checkOut: "May 21, 2023",
    nights: 3,
    totalAmount: 450,
    status: "Cancelled",
    specialRequests: "",
  },
]

