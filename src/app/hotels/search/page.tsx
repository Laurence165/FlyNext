"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { hotelAPI } from "@/app/services/api"
import { useAuth } from "@/app/components/auth/auth-context"
import { useBooking } from "@/app/components/booking/booking-context"
import { bookingAPI } from "@/app/services/api"
import { Star } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ImageIcon } from "lucide-react"

interface Hotel {
  id: string
  name: string
  description: string
  city: string
  starRating?: number
  logo?: string
  address: string
  roomTypes: {
    id: string
    name: string
    totalRooms: number
    pricePerNight: number
    amenities: { amenity: string }[]
    images: string[]
  }[]
}

export default function HotelSearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated, user } = useAuth()
  const { addToCart } = useBooking()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null)
  const [selectedRoomType, setSelectedRoomType] = useState<string>("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const params = {
          city: searchParams.get('city') || '',
          checkIn: searchParams.get('checkIn') || '',
          checkOut: searchParams.get('checkOut') || '',
          guests: searchParams.get('guests') || '',
          minPrice: searchParams.get('minPrice') || '',
          maxPrice: searchParams.get('maxPrice') || '',
          minStarRating: Number(searchParams.get('minStarRating')) || undefined,
        }

        const results = await hotelAPI.getHotels(params)
        setHotels(results as Hotel[])
      } catch (err) {
        console.error('Error fetching hotels:', err)
        setError('Failed to load hotels. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHotels()
  }, [searchParams])

  const handleBookNow = (hotel: Hotel) => {
    if (!isAuthenticated) {
      // Store booking intent in session storage
      sessionStorage.setItem('bookingIntent', JSON.stringify({
        type: 'hotel',
        hotelId: hotel.id,
        checkIn: searchParams.get('checkIn'),
        checkOut: searchParams.get('checkOut'),
        guests: searchParams.get('guests'),
        returnUrl: window.location.pathname + window.location.search
      }))

      // Redirect to login page
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
    }

    setSelectedHotel(hotel)
    setIsDialogOpen(true)
  }

  // Check for booking intent on component mount
  useEffect(() => {
    if (isAuthenticated) {
      const bookingIntent = sessionStorage.getItem('bookingIntent')
      if (bookingIntent) {
        try {
          const intent = JSON.parse(bookingIntent)
          if (intent.type === 'hotel' && intent.hotelId) {
            const hotel = hotels.find(h => h.id === intent.hotelId)
            if (hotel) {
              setSelectedHotel(hotel)
              setIsDialogOpen(true)
            }
          }
          // Clear the booking intent after processing
          sessionStorage.removeItem('bookingIntent')
        } catch (error) {
          console.error('Error processing booking intent:', error)
          sessionStorage.removeItem('bookingIntent')
        }
      }
    }
  }, [isAuthenticated, hotels])

  const handleConfirmBooking = async (roomTypeId: string) => {
    if (!selectedHotel || !searchParams.get('checkIn') || !searchParams.get('checkOut')) return
  
    try {
      setIsBooking(true)
  
      // Find the selected room type details
      const selectedRoom = selectedHotel.roomTypes.find(room => room.id === roomTypeId)
      if (!selectedRoom) {
        throw new Error("Selected room type not found")
      }

      // Parse the check-in and check-out dates
      const checkInDate = new Date(searchParams.get('checkIn')!);
      const checkOutDate = new Date(searchParams.get('checkOut')!);

      // Validate dates
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        throw new Error("Invalid check-in or check-out date");
      }

      // Calculate the number of nights
      const timeDifference = checkOutDate.getTime() - checkInDate.getTime();
      const numberOfNights = Math.ceil(timeDifference / (1000 * 3600 * 24)); // Convert milliseconds to days

      // Calculate the total price
      const totalPrice = selectedRoom.pricePerNight * numberOfNights * Number(searchParams.get('guests'));

  
      // Create booking with proper hotelBooking structure
      const newBooking = await bookingAPI.createBooking({
        hotelBooking: {
          hotelId: selectedHotel.id,
          roomTypeId: selectedRoom.id,
          checkInDate: searchParams.get('checkIn')!,
          checkOutDate: searchParams.get('checkOut')!,
          roomsRequested: Number(searchParams.get('guests')),
          price: selectedRoom.pricePerNight
        },
        totalPrice: totalPrice,
      })
      console.log(newBooking,newBooking.unavailableDates)
      if (newBooking.unavailableDates) {
        toast({
          title: "Room Type Full",
          description: "This room type is full for the selected dates. Please choose another room or date.",
          variant: "destructive",
        })
        return
      }
  
      // Add the reservation with status PENDING
      await addToCart({
        id: `${newBooking.id}-${roomTypeId}`,
        type: "hotel",
        totalPrice: selectedRoom.pricePerNight, // Set total price based on room type
        reservations: [{
          id: selectedRoom.id,
          roomType: {
            hotel: { name: selectedHotel.name },
            name: selectedRoom.name,
          },
          checkInDate: searchParams.get('checkIn')!,
          checkOutDate: searchParams.get('checkOut')!,
          roomsBooked: Number(searchParams.get('guests')),
          status: "PENDING",
          bookingId: newBooking.id,
        }],
      })
      if (newBooking.error){
        throw newBooking.error
      }
  
      toast({
        title: "Success",
        description: "Hotel has been added to your cart",
      })
  
      setIsDialogOpen(false)
      router.push('/cart')
    } catch (error: any) {
      console.error('Error booking hotel:', error)
  
      toast({
        title: "Error",
        description: "Not enough rooms available for this room type.",
        variant: "destructive",
      })
    } finally {
      setIsBooking(false)
    }
  }
  
  

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading hotels...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Hotels in {searchParams.get('city')}</h1>
        <p className="text-muted-foreground">
          {searchParams.get('checkIn')} - {searchParams.get('checkOut')} · {searchParams.get('guests')} guest
          {Number(searchParams.get('guests')) > 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hotels.map((hotel) => (
          <Card key={hotel.id} className="overflow-hidden">
            <div className="relative h-48 w-full">
              <Image
                src={hotel.logo || '/placeholder-hotel.jpg'}
                alt={hotel.name}
                fill
                className="object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle>{hotel.name}</CardTitle>
              <div className="flex items-center space-x-1 mt-1">
                {[...Array(Number(hotel.starRating) || 0)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">{hotel.address}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{hotel.description}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Starting from</p>
                    <p className="font-semibold">
                      ${Math.min(...hotel.roomTypes.map(r => r.pricePerNight))}/night
                    </p>
                  </div>
                  <Button
                    onClick={() => handleBookNow(hotel)}
                    disabled={isBooking}
                  >
                    Book Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {console.log('Dialog Render - Selected Hotel:', selectedHotel)}
        {console.log('Room Types:', selectedHotel?.roomTypes)}
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Select Room Type</DialogTitle>
            <DialogDescription>
              Choose a room type for your stay at {selectedHotel?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {selectedHotel?.roomTypes.map((room) => (
              <div
                key={room.id}
                className="space-y-4 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => handleConfirmBooking(room.id)}
              >
                {/* Room Images */}
                <div className="grid grid-cols-4 gap-2">
                  {room.images && room.images.length > 0 ? (
                    room.images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                        <Image
                          src={image.imageUrl}
                          alt={`${room.name} - Image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-4 aspect-video bg-muted flex items-center justify-center rounded-lg">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Room Details */}
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <h3 className="font-medium text-lg">{room.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Up to {room.totalRooms} rooms
                    </p>
                    
                    {/* Amenities */}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, index) => (
                          <Badge key={index} variant="secondary">
                            {amenity.amenity}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">${room.pricePerNight}</p>
                    <p className="text-sm text-muted-foreground">per night</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {hotels.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No hotels found matching your criteria.</p>
        </div>
      )}
    </div>
  )
}