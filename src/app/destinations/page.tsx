import { Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DestinationsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-6">Explore Destinations</h1>
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="border-none shadow-md">
          <CardContent className="p-4 md:p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-2">
                <label htmlFor="destination" className="text-sm font-medium">
                  Where to?
                </label>
                <Input id="destination" placeholder="City, region, or country" />
              </div>
              <div className="space-y-2">
                <label htmlFor="travel-dates" className="text-sm font-medium">
                  When?
                </label>
                <Input id="travel-dates" placeholder="Select dates" type="date" />
              </div>
              <div className="self-end">
                <Button size="lg" className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Popular Destinations</h2>
            <Select defaultValue="recommended">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((destination) => (
              <Link key={destination.id} href={`/destination/${destination.id}`} className="group">
                <Card className="overflow-hidden border-none shadow-md transition-all hover:shadow-lg">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={destination.image || "/placeholder.svg"}
                      alt={destination.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{destination.name}</h3>
                        <p className="text-sm text-muted-foreground">{destination.country}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${destination.price}</p>
                        <p className="text-xs text-muted-foreground">per person</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Sample destination data
const destinations = [
  {
    id: "1",
    name: "Santorini",
    country: "Greece",
    price: 899,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "2",
    name: "Bali",
    country: "Indonesia",
    price: 799,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "3",
    name: "Tokyo",
    country: "Japan",
    price: 1299,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "4",
    name: "Paris",
    country: "France",
    price: 849,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "5",
    name: "New York",
    country: "United States",
    price: 999,
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    id: "6",
    name: "Barcelona",
    country: "Spain",
    price: 749,
    image: "/placeholder.svg?height=400&width=600",
  },
]

