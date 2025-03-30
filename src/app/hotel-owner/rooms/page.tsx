"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Edit, Trash2, Plus, Bed } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/app/components/auth/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function RoomsList() {
  const { user, isHotelOwner, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== "undefined" && !isLoading) {
      if (!isHotelOwner) {
        router.push("/login")
      }
    }
  }, [isHotelOwner, router, isLoading])

  const handleDeleteRoom = (roomId: string) => {
    // TODO: call an API to delete the room
    toast({
      title: "Room type deleted",
      description: "The room type has been deleted successfully",
    })
  }

  if (!user || !isHotelOwner) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Room Types</h1>
          <p className="text-muted-foreground">Manage your hotel room types</p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/hotel-owner/rooms/add">
            <Plus className="mr-2 h-4 w-4" />
            Add New Room Type
          </Link>
        </Button>
      </div>

      {mockRoomTypes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRoomTypes.map((room) => (
            <Card key={room.id} className="overflow-hidden">
              <div className="relative h-48 w-full">
                <Image
                  src={room.images[0] || "/placeholder.svg?height=400&width=600"}
                  alt={room.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{room.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {room.availableRooms} of {room.totalRooms} available
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-right">${room.pricePerNight}</p>
                    <p className="text-xs text-muted-foreground">per night</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {room.amenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/hotel-owner/rooms/${room.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteRoom(room.id)}>
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
            <Bed className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No room types yet</h3>
          <p className="text-muted-foreground mb-4">You haven't added any room types to your hotel yet.</p>
          <Button asChild>
            <Link href="/hotel-owner/rooms/add">Add Your First Room Type</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

// Mock data
const mockRoomTypes = [
  {
    id: "1",
    name: "Deluxe Double",
    description: "Spacious room with a double bed and city view",
    pricePerNight: 150,
    totalRooms: 10,
    availableRooms: 8,
    amenities: ["Free WiFi", "Air Conditioning", "TV", "Mini Bar"],
    images: ["/placeholder.svg?height=400&width=600"],
  },
  {
    id: "2",
    name: "Executive Suite",
    description: "Luxury suite with separate living area and king bed",
    pricePerNight: 300,
    totalRooms: 5,
    availableRooms: 3,
    amenities: ["Free WiFi", "Air Conditioning", "TV", "Mini Bar", "Bathtub", "Lounge Area"],
    images: ["/placeholder.svg?height=400&width=600"],
  },
  {
    id: "3",
    name: "Twin Room",
    description: "Comfortable room with two single beds",
    pricePerNight: 120,
    totalRooms: 15,
    availableRooms: 12,
    amenities: ["Free WiFi", "Air Conditioning", "TV"],
    images: ["/placeholder.svg?height=400&width=600"],
  },
]

