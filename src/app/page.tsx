import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { hotelAPI } from "./services/api"

// Sample featured hotels data as fallback
const sampleFeaturedHotels = [
  {
    id: "h1",
    name: "Grand Hotel",
    location: "New York, USA",
    price: 150,
    rating: 4.5,
    reviews: 128,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "h2",
    name: "Seaside Resort",
    location: "Miami, USA",
    price: 220,
    rating: 4.8,
    reviews: 95,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "h3",
    name: "Mountain Lodge",
    location: "Denver, USA",
    price: 180,
    rating: 4.2,
    reviews: 76,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "h4",
    name: "City View Hotel",
    location: "Chicago, USA",
    price: 195,
    rating: 4.6,
    reviews: 112,
    image: "/placeholder.svg?height=400&width=600",
  },
]

// Make the component async to fetch data
export default async function HomePage() {
  // Fetch featured hotels from the API with proper error handling
  let featuredHotels = []
  try {
    const apiHotels = await hotelAPI.getFeaturedHotels()
    // Ensure we have an array
    featuredHotels = Array.isArray(apiHotels) ? apiHotels : sampleFeaturedHotels
  } catch (error) {
    console.error("Error fetching featured hotels:", error)
    // Fallback to sample data if API fails
    featuredHotels = sampleFeaturedHotels
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
                <Image src={hotel.image || "/placeholder.svg"} alt={hotel.name} fill className="object-cover" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{hotel.name}</h3>
                    <p className="text-sm text-muted-foreground">{hotel.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${hotel.price}</p>
                    <p className="text-xs text-muted-foreground">per night</p>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <div className="flex">
                    {Array(Math.floor(hotel.rating))
                      .fill(0)
                      .map((_, i) => (
                        <span key={i} className="text-yellow-500">
                          ★
                        </span>
                      ))}
                    {hotel.rating % 1 !== 0 && <span className="text-yellow-500">½</span>}
                  </div>
                  <span className="text-sm ml-1 text-muted-foreground">({hotel.reviews} reviews)</span>
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

