"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Hotel, Plane } from "lucide-react"
import Image from "next/image"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useBooking } from "./booking-context"

type HotelSuggestion = {
  id: string
  name: string
  image: string
  price: number
  location: string
  rating: number
}

type FlightSuggestion = {
  id: string
  airline: string
  departureCode: string
  arrivalCode: string
  departureTime: string
  arrivalTime: string
  price: number
}

export default function CrossSell() {
  const { cart } = useBooking()
  const router = useRouter()
  const [hotelSuggestions, setHotelSuggestions] = useState<HotelSuggestion[]>([])
  const [flightSuggestions, setFlightSuggestions] = useState<FlightSuggestion[]>([])

  const flightItem = cart.find((item) => item.type === "flight")
  const hotelItem = cart.find((item) => item.type === "hotel")

  // If we have a flight but no hotel, suggest hotels
  const shouldShowHotels = flightItem && !hotelItem

  // If we have a hotel but no flight, suggest flights
  const shouldShowFlights = hotelItem && !flightItem

  useEffect(() => {
    // Mock API call to get hotel suggestions based on flight destination
    if (shouldShowHotels && flightItem?.flight?.arrivalCode) {
      //TODO: Make API CALL 
      const mockHotels: HotelSuggestion[] = [
        {
          id: "h1",
          name: "Grand Hotel",
          image: "/placeholder.svg?height=200&width=300",
          price: 150,
          location: "Downtown",
          rating: 4.5,
        },
        {
          id: "h2",
          name: "Seaside Resort",
          image: "/placeholder.svg?height=200&width=300",
          price: 220,
          location: "Beachfront",
          rating: 4.8,
        },
        {
          id: "h3",
          name: "City View Hotel",
          image: "/placeholder.svg?height=200&width=300",
          price: 120,
          location: "City Center",
          rating: 4.2,
        },
      ]
      setHotelSuggestions(mockHotels)
    }

    // Mock API call to get flight suggestions based on hotel location
    if (shouldShowFlights && hotelItem?.hotel?.hotelName) {
      //TODO: , this would be an API call
      const mockFlights: FlightSuggestion[] = [
        {
          id: "f1",
          airline: "Delta Airlines",
          departureCode: "JFK",
          arrivalCode: "LAX",
          departureTime: "08:30 AM",
          arrivalTime: "11:45 AM",
          price: 349,
        },
        {
          id: "f2",
          airline: "American Airlines",
          departureCode: "JFK",
          arrivalCode: "LAX",
          departureTime: "10:15 AM",
          arrivalTime: "01:30 PM",
          price: 329,
        },
        {
          id: "f3",
          airline: "United Airlines",
          departureCode: "JFK",
          arrivalCode: "LAX",
          departureTime: "02:45 PM",
          arrivalTime: "06:00 PM",
          price: 379,
        },
      ]
      setFlightSuggestions(mockFlights)
    }
  }, [flightItem, hotelItem, shouldShowHotels, shouldShowFlights])

  const handleViewHotels = () => {
    if (flightItem?.flight?.arrivalCode) {
      // Navigate to hotels page with destination pre-filled
      router.push(`/hotels?destination=${flightItem.flight.arrivalCode}`)
    }
  }

  const handleViewFlights = () => {
    // Navigate to flights page
    router.push("/flights")
  }

  if (!shouldShowHotels && !shouldShowFlights) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {shouldShowHotels ? (
            <div className="flex items-center space-x-2">
              <Hotel className="h-5 w-5" />
              <span>Recommended Hotels</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Plane className="h-5 w-5" />
              <span>Recommended Flights</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shouldShowHotels &&
            hotelSuggestions.map((hotel) => (
              <Card key={hotel.id} className="overflow-hidden">
                <div className="relative h-32 w-full">
                  <Image src={hotel.image || "/placeholder.svg"} alt={hotel.name} fill className="object-cover" />
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium">{hotel.name}</h3>
                  <p className="text-sm text-muted-foreground">{hotel.location}</p>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm ml-1">{hotel.rating}</span>
                    </div>
                    <p className="font-medium">${hotel.price}/night</p>
                  </div>
                </CardContent>
              </Card>
            ))}

          {shouldShowFlights &&
            flightSuggestions.map((flight) => (
              <Card key={flight.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <h3 className="font-medium">{flight.airline}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      <p className="text-sm">{flight.departureTime}</p>
                      <p className="text-xs text-muted-foreground">{flight.departureCode}</p>
                    </div>
                    <div className="flex-1 mx-2 border-t border-dashed relative">
                      <Plane className="h-3 w-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{flight.arrivalTime}</p>
                      <p className="text-xs text-muted-foreground">{flight.arrivalCode}</p>
                    </div>
                  </div>
                  <p className="font-medium text-right mt-2">${flight.price}</p>
                </CardContent>
              </Card>
            ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={shouldShowHotels ? handleViewHotels : handleViewFlights}>
          {shouldShowHotels ? "View All Hotels" : "View All Flights"}
        </Button>
      </CardFooter>
    </Card>
  )
}

