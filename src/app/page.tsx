import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, MapPin, Plane, Hotel, Search, Star } from "lucide-react";
import { hotelAPI } from "./services/api";
import { HotelCarousel } from "./components/hotel-carousel";

interface Hotel {
  id: string;
  name: string;
  logo?: string;
  address: string;
  city: string;
  starRating?: number;
}

// Make the component async to fetch data
export default async function HomePage() {
  // Fetch featured hotels from the API with proper error handling
  let featuredHotels: Hotel[] = [];
  try {
    const apiHotels = await hotelAPI.getFeaturedHotels();
    featuredHotels = Array.isArray(apiHotels) ? apiHotels : [];

    // Limit to 6 featured hotels for the carousel
    featuredHotels = featuredHotels.slice(0, 6);
  } catch (error) {
    console.error("Error fetching featured hotels:", error);
    featuredHotels = []; // Empty array if API fails
  }

  // Popular destinations
  const popularDestinations = [
    {
      name: "New York",
      country: "USA",
      image: "https://ik.imagekit.io/4jhmjkcvp/nyc.jpg",
    },
    {
      name: "Paris",
      country: "France",
      image: "https://ik.imagekit.io/4jhmjkcvp/paris.jpg",
    },
    {
      name: "Tokyo",
      country: "Japan",
      image: "https://ik.imagekit.io/4jhmjkcvp/tokyo.jpg",
    },
    {
      name: "London",
      country: "UK",
      image: "https://ik.imagekit.io/4jhmjkcvp/london.jpg",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Introduction Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Travel the World with Ease
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Discover your perfect journey with the best flights, hotels, and
              destinations worldwide
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="default" size="lg" asChild>
                <Link href="/flights" className="flex items-center gap-2">
                  <Plane className="h-5 w-5" />
                  Search Flights
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/hotels" className="flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Search Hotels
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hotels Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Featured Hotels</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover our handpicked selection of the finest accommodations
              around the globe
            </p>
          </div>

          <HotelCarousel hotels={featuredHotels} />

          <div className="mt-8 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/hotels" className="flex items-center">
                Explore All Hotels
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">Popular Destinations</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore trending locations that travelers love
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularDestinations.map((destination, index) => (
              <div key={index} className="group">
                <div className="relative h-80 rounded-2xl overflow-hidden">
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105 duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold text-white">
                      {destination.name}
                    </h3>
                    <p className="text-white/80">{destination.country}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button size="lg" asChild>
              <Link href="/flights" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search Flights
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials - Simplified */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">What Our Customers Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Read testimonials from travelers who chose FlyNext
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((item) => (
              <Card key={item}>
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "FlyNext made our vacation planning so easy. We found the
                    perfect hotel and flights in minutes, and the entire trip
                    was seamless."
                  </p>
                  <div>
                    <h4 className="font-semibold">Sarah Johnson</h4>
                    <p className="text-xs text-muted-foreground">
                      Traveled to Paris
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Sign up now and get exclusive deals on flights and hotels worldwide
          </p>
          <Button size="lg" asChild>
            <Link href="/signup">Create an Account</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
