"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Hotel {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  city: string;
  starRating?: number;
}

interface HotelCarouselProps {
  hotels: Hotel[];
}

export function HotelCarousel({ hotels }: HotelCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const visibleHotels = 4; // Number of hotels visible at once

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex + 1 >= hotels.length ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex - 1 < 0 ? hotels.length - 1 : prevIndex - 1
    );
  };

  // Create a circular array of hotels for infinite scrolling
  const displayHotels = [...hotels, ...hotels].slice(
    currentIndex,
    currentIndex + visibleHotels
  );

  // If we don't have enough hotels to display, pad with the beginning ones
  if (displayHotels.length < visibleHotels) {
    displayHotels.push(
      ...hotels.slice(0, visibleHotels - displayHotels.length)
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden">
        <div className="flex gap-6 transition-transform duration-500 ease-in-out">
          {displayHotels.map((hotel, index) => (
            <div
              key={`${hotel.id}-${index}`}
              className="min-w-[calc(25%-18px)] max-w-[calc(25%-18px)] flex-shrink-0"
            >
                <Card className="overflow-hidden hover:shadow-lg transition-all h-full bg-white border dark:bg-gray-900 dark:border-gray-800">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={
                        hotel.logo ||
                        "https://ik.imagekit.io/4jhmjkcvp/placeholder-hotel.jpg"
                      }
                      alt={hotel.name}
                      fill
                      className="object-cover transition-transform hover:scale-105 duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-white dark:bg-gray-900 rounded-md px-2 py-1 flex items-center">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="text-xs font-medium">
                        {hotel.starRating || 5}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg line-clamp-1">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center mt-1 text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <p className="text-sm line-clamp-1">{hotel.city}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t dark:border-gray-800 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Starting from
                      </span>
                      <span className="text-primary font-semibold">
                        $129/night
                      </span>
                    </div>
                  </CardContent>
                </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation buttons with matching style */}
      <button
        onClick={prevSlide}
        className="absolute top-1/2 -translate-y-1/2 -left-4 bg-white border border-gray-200 p-2 rounded-full shadow-md hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-800 dark:hover:bg-gray-800 z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute top-1/2 -translate-y-1/2 -right-4 bg-white border border-gray-200 p-2 rounded-full shadow-md hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-800 dark:hover:bg-gray-800 z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
