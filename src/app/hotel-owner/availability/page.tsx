"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, ChevronLeft, ChevronRight, Edit } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/app/components/auth/auth-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, addDays, eachDayOfInterval } from "date-fns"

export default function AvailabilityCalendar() {
  const { user, isHotelOwner, isLoading } = useAuth()
  const router = useRouter()
  const [selectedHotel, setSelectedHotel] = useState("1")
  const [selectedRoomType, setSelectedRoomType] = useState("")
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 14))
  const [dateRange, setDateRange] = useState<Date[]>([])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== "undefined" && !isLoading) {
      if (!isHotelOwner) {
        router.push("/login")
      }
    }
  }, [isHotelOwner, router, isLoading])

  useEffect(() => {
    // Generate date range
    setDateRange(eachDayOfInterval({ start: startDate, end: endDate }))
  }, [startDate, endDate])

  const handlePreviousPeriod = () => {
    const newStartDate = addDays(startDate, -15)
    const newEndDate = addDays(endDate, -15)
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  const handleNextPeriod = () => {
    const newStartDate = addDays(startDate, 15)
    const newEndDate = addDays(endDate, 15)
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  // Get availability for a specific date and room type
  const getAvailability = (date: Date, roomTypeId: string) => {
    // TODO: this would come from your API
    const roomType = mockRoomTypes.find((rt) => rt.id === roomTypeId)
    if (!roomType) return null

    // Check if there's a specific availability entry for this date
    const dateStr = format(date, "yyyy-MM-dd")
    const specificAvailability = mockAvailability.find((a) => a.roomTypeId === roomTypeId && a.date === dateStr)

    if (specificAvailability) {
      return specificAvailability.availableRooms
    }

    // Otherwise return the default availability
    return roomType.availableRooms
  }

  if (!user || !isHotelOwner) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  const filteredRoomTypes = selectedHotel ? mockRoomTypes.filter((rt) => rt.hotelId === selectedHotel) : mockRoomTypes

  const displayedRoomTypes = selectedRoomType
    ? filteredRoomTypes.filter((rt) => rt.id === selectedRoomType)
    : filteredRoomTypes

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Room Availability</h1>
          <p className="text-muted-foreground">View and manage room availability for specific date ranges</p>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Availability Calendar</CardTitle>
          <CardDescription>View and update room availability across dates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-2 block">Hotel</label>
              <Select value={selectedHotel} onValueChange={setSelectedHotel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hotel" />
                </SelectTrigger>
                <SelectContent>
                  {mockHotels.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-2 block">Room Type</label>
              <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                <SelectTrigger>
                  <SelectValue placeholder="All room types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All room types</SelectItem>
                  {filteredRoomTypes.map((roomType) => (
                    <SelectItem key={roomType.id} value={roomType.id}>
                      {roomType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    defaultMonth={startDate}
                    selected={{
                      from: startDate,
                      to: endDate,
                    }}
                    onSelect={(range) => {
                      if (range?.from) {
                        setStartDate(range.from)
                      }
                      if (range?.to) {
                        setEndDate(range.to)
                      }
                      setIsCalendarOpen(false)
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" size="sm" onClick={handlePreviousPeriod}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              {format(startDate, "MMMM d, yyyy")} - {format(endDate, "MMMM d, yyyy")}
            </div>
            <Button variant="outline" size="sm" onClick={handleNextPeriod}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted/50 min-w-[150px]">Room Type</th>
                  {dateRange.map((date) => (
                    <th key={date.toString()} className="border p-2 bg-muted/50 min-w-[80px] text-center">
                      <div>{format(date, "EEE")}</div>
                      <div>{format(date, "MMM d")}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedRoomTypes.map((roomType) => (
                  <tr key={roomType.id}>
                    <td className="border p-2 font-medium">
                      <div className="flex justify-between items-center">
                        <span>{roomType.name}</span>
                        <Button variant="ghost" size="icon" asChild className="h-6 w-6">
                          <Link href={`/hotel-owner/rooms/${roomType.id}`}>
                            <Edit className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">{roomType.totalRooms} total rooms</div>
                    </td>
                    {dateRange.map((date) => {
                      const available = getAvailability(date, roomType.id)
                      const availabilityPercentage = available !== null ? (available / roomType.totalRooms) * 100 : 0

                      let bgColorClass = "bg-green-100 text-green-800"
                      if (availabilityPercentage <= 0) {
                        bgColorClass = "bg-red-100 text-red-800"
                      } else if (availabilityPercentage < 30) {
                        bgColorClass = "bg-orange-100 text-orange-800"
                      } else if (availabilityPercentage < 60) {
                        bgColorClass = "bg-yellow-100 text-yellow-800"
                      }

                      return (
                        <td key={date.toString()} className={`border p-2 text-center ${bgColorClass}`}>
                          {available !== null ? `${available}/${roomType.totalRooms}` : "N/A"}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-4 mt-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-100 mr-1"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-100 mr-1"></div>
              <span>Limited</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-orange-100 mr-1"></div>
              <span>Almost Full</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-100 mr-1"></div>
              <span>Fully Booked</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Mock data
const mockHotels = [
  {
    id: "1",
    name: "Grand Hotel",
  },
  {
    id: "2",
    name: "Seaside Resort",
  },
]

const mockRoomTypes = [
  {
    id: "1",
    hotelId: "1",
    name: "Deluxe Double",
    totalRooms: 10,
    availableRooms: 8,
  },
  {
    id: "2",
    hotelId: "1",
    name: "Executive Suite",
    totalRooms: 5,
    availableRooms: 3,
  },
  {
    id: "3",
    hotelId: "1",
    name: "Twin Room",
    totalRooms: 15,
    availableRooms: 12,
  },
  {
    id: "4",
    hotelId: "2",
    name: "Ocean View",
    totalRooms: 20,
    availableRooms: 15,
  },
  {
    id: "5",
    hotelId: "2",
    name: "Garden View",
    totalRooms: 25,
    availableRooms: 20,
  },
]

const mockAvailability = [
  { roomTypeId: "1", date: "2023-05-15", availableRooms: 5 },
  { roomTypeId: "1", date: "2023-05-16", availableRooms: 3 },
  { roomTypeId: "1", date: "2023-05-17", availableRooms: 0 },
  { roomTypeId: "2", date: "2023-05-15", availableRooms: 2 },
  { roomTypeId: "2", date: "2023-05-16", availableRooms: 1 },
  { roomTypeId: "2", date: "2023-05-17", availableRooms: 0 },
  { roomTypeId: "3", date: "2023-05-15", availableRooms: 10 },
  { roomTypeId: "3", date: "2023-05-16", availableRooms: 8 },
  { roomTypeId: "3", date: "2023-05-17", availableRooms: 5 },
]

