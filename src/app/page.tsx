import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { hotelAPI } from "./services/api"

interface Hotel {
  id: string
  name: string
  logo?: string
  address: string
  city: string
  starRating?: number
}

// Make the component async to fetch data
export default async function HomePage() {
  // Fetch featured hotels from the API with proper error handling
  let featuredHotels: Hotel[] = []
  try {
    const apiHotels = await hotelAPI.getFeaturedHotels()
    featuredHotels = Array.isArray(apiHotels) ? apiHotels : []
  } catch (error) {
    console.error("Error fetching featured hotels:", error)
    featuredHotels = [] // Empty array if API fails
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">FlyNext</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover your perfect journey with the best flights, hotels, and destinations worldwide
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
        <Link href="/flights" className="group">
          <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg h-full">
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="Flights"
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-xl font-bold text-white">Flights</h2>
                <p className="text-sm text-white/80">Find the best deals on flights</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/hotels" className="group">
          <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg h-full">
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="Hotels"
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-xl font-bold text-white">Hotels</h2>
                <p className="text-sm text-white/80">Book your perfect stay</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Featured Hotels Section */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Featured Hotels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredHotels.map((hotel) => (
            <Card key={hotel.id} className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
              <div className="relative h-48 w-full overflow-hidden">
                <Image 
                  src={hotel.logo || "/placeholder-hotel.jpg"} 
                  alt={hotel.name} 
                  fill 
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{hotel.name}</h3>
                    <p className="text-sm text-muted-foreground">{hotel.city}</p>
                    <p className="text-xs text-muted-foreground mt-1">{hotel.address}</p>
                  </div>
                  {hotel.starRating && (
                    <div className="text-yellow-500">
                      {'★'.repeat(hotel.starRating)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button asChild>
            <Link href="/hotels">View All Hotels</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

