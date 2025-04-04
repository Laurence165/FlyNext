"use client";

import { useState } from "react";
import { X, Star, ShoppingCart, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useBooking } from "./booking/booking-context";
import { useRouter } from "next/navigation";

interface Hotel {
  id: string;
  name: string;
  price: number;
  starRating: number;
  image?: string;
}

interface HotelSuggestionsProps {
  hotels: Hotel[];
  onClose: () => void;
}

export default function HotelSuggestions({
  hotels,
  onClose,
}: HotelSuggestionsProps) {
  const { toast } = useToast();
  const { addToCart } = useBooking();
  const router = useRouter();
  const [isBooking, setIsBooking] = useState<string | null>(null);
  const displayHotels = hotels.slice(0, 3); // Limit to 3 hotels

  const handleAddToCart = async (hotel: Hotel) => {
    try {
      setIsBooking(hotel.id);
      // Create a basic hotel reservation request
      const bookingData = {
        totalPrice: hotel.price,
        hotelReservation: {
          roomTypeId: hotel.id,
          checkInDate: new Date(), // You might want to add date selection
          checkOutDate: new Date(Date.now() + 86400000), // Default to 1 day
          roomsBooked: 1,
          adults: 1,
          children: 0,
        },
      };

      const success = await addToCart(bookingData);
      if (success) {
        toast({
          title: "Added to cart",
          description: `${hotel.name} has been added to your cart.`,
        });
        router.push("/cart");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add hotel to cart",
        variant: "destructive",
      });
    } finally {
      setIsBooking(null);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <CardHeader>
        <CardTitle>Suggested Hotels</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {displayHotels.map((hotel) => (
          <Card key={hotel.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{hotel.name}</h3>
                <div className="flex items-center mt-1">
                  {[...Array(hotel.starRating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="mt-2 font-bold">${hotel.price}/night</p>
              </div>
              <Button
                size="sm"
                onClick={() => handleAddToCart(hotel)}
                disabled={isBooking === hotel.id}
              >
                {isBooking === hotel.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4 mr-2" />
                )}
                {isBooking === hotel.id ? "Adding..." : "Book Now"}
              </Button>
            </div>
          </Card>
        ))}

        {hotels.length === 0 && (
          <p className="text-center text-muted-foreground">No hotels found.</p>
        )}
      </CardContent>
    </Card>
  );
}
