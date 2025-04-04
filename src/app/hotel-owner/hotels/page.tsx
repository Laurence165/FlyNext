"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Plus, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useAuth } from "@/app/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Hotel } from "@/types"
import { hotelAPI } from "@/app/services/api"

export default function HotelsList() {
  const { user, isHotelOwner, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [isLoadingHotels, setIsLoadingHotels] = useState(true)

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== "undefined" && !isLoading) {
      if (!isHotelOwner) {
        router.push("/login")
      }
    }
  }, [isHotelOwner, router, isLoading])

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const data = await hotelAPI.getMyHotels()
        setHotels(data)
      } catch (error) {
        console.error('Error fetching hotels:', error)
        toast({
          title: "Error",
          description: "Failed to load hotels",
          variant: "destructive",
        })
      } finally {
        setIsLoadingHotels(false)
      }
    }

    if (isHotelOwner) {
      fetchHotels()
    }
  }, [isHotelOwner, toast])

  const handleDeleteHotel = async (hotelId: string) => {
    try {
      await hotelAPI.deleteHotels(hotelId)
      setHotels(hotels.filter(hotel => hotel.id !== hotelId))
      
      toast({
        title: "Hotel deleted",
        description: "The hotel has been deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting hotel:', error)
      toast({
        title: "Error",
        description: "Failed to delete hotel",
        variant: "destructive",
      })
    }
  }
  
  if (!user || !isHotelOwner) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (isLoadingHotels) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading hotels...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Hotels</h1>
          <p className="text-muted-foreground">Manage your hotel properties</p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/hotel-owner/hotels/add">
            <Plus className="mr-2 h-4 w-4" />
            Add New Hotel
          </Link>
        </Button>
      </div>

      {hotels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <Card key={hotel.id} className="overflow-hidden">
              <div className="relative h-48 w-full">
                <Image
                  src={hotel.logo || "/placeholder.svg?height=400&width=600"}
                  alt={hotel.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{hotel.name}</h2>
                    <p className="text-sm text-muted-foreground">{hotel.address}</p>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="ml-1 text-sm font-medium">{hotel.starRating}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm">
                    <span className="font-medium">Location:</span> {hotel.city}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Images:</span> {hotel.images.length}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/hotel-owner/hotels/edit?id=${hotel.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>

                <Button variant="destructive" size="sm" onClick={() => handleDeleteHotel(hotel.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No hotels yet</h3>
          <p className="text-muted-foreground mb-4">You haven't added any hotels to your account yet.</p>
          <Button asChild>
            <Link href="/hotel-owner/hotels/add">Add Your First Hotel</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

// // Mock data
// const mockHotels = [
//   {
//     id: "1",
//     name: "Grand Hotel",
//     address: "123 Main St, New York, NY 10001",
//     location: { lat: 40.7128, lng: -74.006 },
//     starRating: 4.5,
//     totalRooms: 50,
//     roomTypes: ["Deluxe Double", "Executive Suite", "Twin Room"],
//     images: ["/placeholder.svg?height=400&width=600"],
//   },
//   {
//     id: "2",
//     name: "Seaside Resort",
//     address: "456 Ocean Ave, Miami, FL 33139",
//     location: { lat: 25.7617, lng: -80.1918 },
//     starRating: 5,
//     totalRooms: 120,
//     roomTypes: ["Ocean View", "Garden View", "Presidential Suite", "Family Room"],
//     images: ["/placeholder.svg?height=400&width=600"],
//   },
// ]

