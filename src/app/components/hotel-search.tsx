"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { format } from "date-fns";
import { hotelAPI } from "@/app/services/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface City {
  id: string;
  name: string;
  country: string;
}

export default function HotelSearch() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState(1);
  const [minStarRating, setMinStarRating] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("/api/cities");
        const data = await response.json();
        setCities(data);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  const handleSearch = async () => {
    if (!selectedCity || !checkIn || !checkOut) return;

    try {
      setIsLoading(true);

      const searchParams: Record<string, string> = {
        city: selectedCity.name,
        cityId: selectedCity.id,
        country: selectedCity.country,
        checkIn: format(checkIn!, "yyyy-MM-dd"),
        checkOut: format(checkOut!, "yyyy-MM-dd"),
        guests: guests.toString(),
      };

      // Add all price and rating params, converting to strings
      if (minPrice >= 0) {
        searchParams.minPrice = minPrice.toString();
      }

      if (maxPrice > 0) {
        searchParams.maxPrice = maxPrice.toString();
      }
      if (minStarRating > 0) {
        searchParams.minStarRating = minStarRating.toString();
      }

      console.log("Search params:", searchParams);

      //const hotels = await hotelAPI.getHotels(searchParams)
      //sessionStorage.setItem('hotelSearchResults', JSON.stringify(hotels))

      const urlParams = new URLSearchParams(searchParams);
      router.push(`/hotels/search?${urlParams.toString()}`);
    } catch (error) {
      console.error("Error searching hotels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Destination</Label>
            <Popover
              open={isDestinationOpen}
              onOpenChange={setIsDestinationOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isDestinationOpen}
                  className="w-full justify-between"
                >
                  {selectedCity
                    ? `${selectedCity.name}, ${selectedCity.country}`
                    : "Search for a city..."}
                  <MapPin className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search cities..." />
                  <CommandList>
                    <CommandEmpty>No cities found.</CommandEmpty>
                    <CommandGroup>
                      {cities.map((city) => (
                        <CommandItem
                          key={city.id}
                          value={`${city.name}, ${city.country}`}
                          onSelect={(value) => {
                            setSelectedCity(city);
                            setIsDestinationOpen(false);
                          }}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          {city.name}, {city.country}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {checkIn ? format(checkIn, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Check-out</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {checkOut ? format(checkOut, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Guests</Label>
              <Input
                type="number"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Min Star Rating</Label>
              <Input
                type="number"
                min="0"
                max="5"
                value={minStarRating}
                onChange={(e) => setMinStarRating(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Price Range</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="self-end">
            <Button
              size="lg"
              className="w-full"
              onClick={handleSearch}
              disabled={!selectedCity || !checkIn || !checkOut || isLoading}
            >
              {isLoading ? (
                "Searching..."
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
