"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronDown, Plane } from "lucide-react"
import { format } from "date-fns"
import { Airport } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/components/auth/auth-context"
import { useBooking } from "./booking/booking-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { flightAPI } from "../services/api"
import { useToast } from "@/components/ui/use-toast"

export default function FlightSearch() {
  const [tripType, setTripType] = useState<"oneWay" | "roundTrip">("roundTrip")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [departureDate, setDepartureDate] = useState<Date>()
  const [returnDate, setReturnDate] = useState<Date>()
  const [isFromOpen, setIsFromOpen] = useState(false)
  const [isToOpen, setIsToOpen] = useState(false)
  const [passengers, setPassengers] = useState(1)
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [flights, setFlights] = useState<{ results?: any[], outbound?: any[], return?: any[] }>({})
  const [airports, setAirports] = useState<Airport[]>([])
  const { addToCart } = useBooking()
  const { toast } = useToast()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isBooking, setIsBooking] = useState(false)

  useEffect(() => {
    async function fetchAirports() {
      try {
        const response = await fetch('/api/flights/airports')
        const data = await response.json()
        setAirports(data)
      } catch (error) {
        console.error('Error fetching airports:', error)
      }
    }

    fetchAirports()
  }, [])

  const handleSearch = async () => {
    if (!from || !to || !departureDate || (tripType === "roundTrip" && !returnDate)) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const searchParams = {
        origin: from,
        destination: to,
        departDate: departureDate.toISOString().split("T")[0],
        returnDate: returnDate?.toISOString().split("T")[0],
      }

      const flightResults = await flightAPI.searchFlights(searchParams)
      console.log('Flight results:', flightResults)
      setFlights(flightResults)
      setShowResults(true)
    } catch (error) {
      console.error("Error searching flights:", error)
      setError("Unable to search flights. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBookFlight = async (result: any) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to book flights",
        duration: 5000,
      });
      
      const searchState = {
        from,
        to,
        departureDate,
        returnDate,
        tripType,
        selectedFlight: result,
      };
      sessionStorage.setItem("pendingFlightSearch", JSON.stringify(searchState));
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    try {
      setIsBooking(true);

      // Compose booking data depending on tripType
      const flightBookings = result.flights.map((flight: any) => ({
        afsFlightId: flight.id,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        source: flight.origin.code,
        destination: flight.destination.code,
        price: flight.price,
      }));

      const totalPrice = flightBookings.reduce((sum, f) => sum + f.price, 0);

      const bookingData: any = {
        totalPrice,
      };

      if (tripType === "oneWay") {
        bookingData.flightBooking = flightBookings[0]; // send as object
      } else {
        bookingData.flightBooking = flightBookings; // send as array
      }

      console.log("Booking payload:", bookingData);

      // Use the context method instead of direct API call
      const booking = await addToCart(bookingData);

      if (booking) {
        toast({
          title: "Success!",
          description: "Flight added to your cart. Proceed to checkout to complete your booking.",
          duration: 5000,
        });

        sessionStorage.removeItem("pendingFlightSearch");
        router.push("/cart");
      } else {
        throw new Error("Failed to add flight to cart");
      }
    } catch (error) {
      console.error("Error booking flight:", error);
      toast({
        title: "Booking Failed",
        description: "There was an error adding the flight to your cart. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-none shadow-md">
        <CardContent className="p-4 md:p-6">
          <div className="space-y-6">
            <RadioGroup
              defaultValue="roundTrip"
              className="flex space-x-4"
              onValueChange={(value) => setTripType(value as "oneWay" | "roundTrip")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="roundTrip" id="roundTrip" />
                <Label htmlFor="roundTrip">Round Trip</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="oneWay" id="oneWay" />
                <Label htmlFor="oneWay">One Way</Label>
              </div>
            </RadioGroup>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isFromOpen}
                      className="w-full justify-between"
                    >
                      {from ? airports.find((airport) => airport.code === from)?.name : "Select airport or city"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search airport or city..." />
                      <CommandList>
                        <CommandEmpty>No airport or city found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {airports.map((airport) => (
                            <CommandItem
                              key={airport.id}
                              value={airport.code}
                              onSelect={(currentValue) => {
                                setFrom(currentValue)
                                setIsFromOpen(false)
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{airport.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {airport.code} - {airport.city.name}, {airport.country}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <Popover open={isToOpen} onOpenChange={setIsToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isToOpen}
                      className="w-full justify-between"
                    >
                      {to ? airports.find((airport) => airport.code === to)?.name : "Select airport or city"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <CommandInput placeholder="Search airport or city..." />
                      <CommandList>
                        <CommandEmpty>No airport or city found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {airports.map((airport) => (
                            <CommandItem
                              key={airport.id}
                              value={airport.code}
                              onSelect={(currentValue) => {
                                setTo(currentValue)
                                setIsToOpen(false)
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{airport.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {airport.code} - {airport.city.name}, {airport.country}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Departure</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {departureDate && typeof window !== "undefined" ? format(departureDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={departureDate}
                      onSelect={setDepartureDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {tripType === "roundTrip" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Return</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <Calendar className="mr-2 h-4 w-4" />
                        {returnDate && typeof window !== "undefined" ? format(returnDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={returnDate}
                        onSelect={setReturnDate}
                        initialFocus
                        disabled={(date) => date < new Date() || (departureDate ? date < departureDate : false)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Passengers:</label>
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setPassengers(Math.max(1, passengers - 1))}
                  >
                    -
                  </Button>
                  <span className="mx-2">{passengers}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setPassengers(passengers + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <Button
                size="lg"
                className="px-8"
                onClick={handleSearch}
                disabled={!from || !to || !departureDate || (tripType === "roundTrip" && !returnDate)}
              >
                <Plane className="mr-2 h-4 w-4" />
                Search Flights
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {isLoading && (
        <div className="text-center">
          <p>Searching for flights...</p>
        </div>
      )}
      {error && (
        <div className="text-red-500 text-center">
          {error}
        </div>
      )}
      {showResults && !isLoading && (
        <FlightResults
          from={from}
          to={to}
          departureDate={departureDate}
          returnDate={returnDate}
          tripType={tripType}
          flights={flights}
          airports={airports}
          onBookFlight={handleBookFlight}
        />
      )}
    </div>
  )
}

interface FlightResultsProps {
  from: string
  to: string
  departureDate?: Date
  returnDate?: Date
  tripType: "oneWay" | "roundTrip"
  flights: {
    results?: Array<{
      legs: number
      flights: Array<{
        id: string
        flightNumber: string
        departureTime: string
        arrivalTime: string
        airline: {
          code: string
          name: string
        }
        origin: {
          code: string
          name: string
          city: string
          country: string
        }
        destination: {
          code: string
          name: string
          city: string
          country: string
        }
        price: number
        currency: string
      }>
    }>
    outbound?: any[]
    return?: any[]
  }
  airports: Airport[]
  onBookFlight: (result: any) => Promise<void>
}

function FlightResults({ from, to, departureDate, returnDate, tripType, flights, airports, onBookFlight }: FlightResultsProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [isBooking, setIsBooking] = useState(false)

  const fromAirport = airports.find((airport) => airport.code === from)
  const toAirport = airports.find((airport) => airport.code === to)

  const flightResults = flights.results || []

  const handleBookClick = async (result: any) => {
    setIsBooking(true);
    try {
      await onBookFlight(result);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {fromAirport?.city?.name} to {toAirport?.city?.name}
          {departureDate && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {format(departureDate, "MMM d, yyyy")}
              {tripType === "roundTrip" && returnDate && ` - ${format(returnDate, "MMM d, yyyy")}`}
            </span>
          )}
        </h2>
      </div>

      <div className="space-y-4">
        {flightResults.map((result, index) => (
          <Card key={index} className="mb-4">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  {result.flights.map((flight, flightIndex) => (
                    <div key={flight.id} className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{flight.airline.name}</p>
                        <p className="text-sm text-muted-foreground">Flight {flight.flightNumber}</p>
                        <div className="mt-2">
                          <p>{format(new Date(flight.departureTime), 'HH:mm')} - {format(new Date(flight.arrivalTime), 'HH:mm')}</p>
                          <p className="text-sm text-muted-foreground">
                            {flight.origin.city} ({flight.origin.code}) → {flight.destination.city} ({flight.destination.code})
                          </p>
                        </div>
                      </div>
                      {flightIndex < result.flights.length - 1 && (
                        <div className="text-sm text-muted-foreground">
                          <Plane className="h-4 w-4 rotate-90" />
                          <span>Connection</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {result.flights[0].currency} {result.flights.reduce((total, flight) => total + flight.price, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.legs > 1 ? `${result.legs - 1} stops` : 'Direct'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => handleBookClick(result)}
                    disabled={isBooking}
                  >
                    {isBooking ? (
                      <div className="flex items-center gap-2">
                        <span>Booking...</span>
                      </div>
                    ) : (
                      isAuthenticated ? 'Select & Book' : 'Login to Book'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// Mock data for airports
const airports = [
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "USA" },
  { code: "LHR", name: "Heathrow Airport", city: "London", country: "UK" },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France" },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "USA" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "UAE" },
  { code: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan" },
  { code: "SIN", name: "Changi Airport", city: "Singapore", country: "Singapore" },
  { code: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands" },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany" },
  { code: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "China" },
  { code: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "USA" },
  { code: "SYD", name: "Sydney Airport", city: "Sydney", country: "Australia" },
  { code: "MAD", name: "Madrid-Barajas Airport", city: "Madrid", country: "Spain" },
  { code: "BCN", name: "Barcelona-El Prat Airport", city: "Barcelona", country: "Spain" },
  { code: "FCO", name: "Leonardo da Vinci International Airport", city: "Rome", country: "Italy" },
]

// Mock data for flights
const mockFlights = [
  {
    id: "1",
    airline: "Delta Airlines",
    flightNumber: "DL123",
    departureCode: "JFK",
    departureTime: "08:30 AM",
    arrivalCode: "LHR",
    arrivalTime: "08:45 PM",
    duration: "7h 15m",
    stops: 0,
    layovers: [],
    price: 649,
    class: "Economy",
  },
  {
    id: "2",
    airline: "British Airways",
    flightNumber: "BA456",
    departureCode: "JFK",
    departureTime: "10:15 AM",
    arrivalCode: "LHR",
    arrivalTime: "10:30 PM",
    duration: "7h 15m",
    stops: 0,
    layovers: [],
    price: 689,
    class: "Economy",
  },
  {
    id: "3",
    airline: "American Airlines",
    flightNumber: "AA789",
    departureCode: "JFK",
    departureTime: "02:45 PM",
    arrivalCode: "LHR",
    arrivalTime: "04:30 AM",
    duration: "8h 45m",
    stops: 1,
    layovers: [{ airport: "Boston Logan", code: "BOS", duration: "1h 30m" }],
    price: 599,
    class: "Economy",
  },
  {
    id: "4",
    airline: "United Airlines",
    flightNumber: "UA101",
    departureCode: "JFK",
    departureTime: "09:30 PM",
    arrivalCode: "LHR",
    arrivalTime: "11:15 AM",
    duration: "8h 45m",
    stops: 0,
    layovers: [],
    price: 729,
    class: "Economy",
  },
  {
    id: "5",
    airline: "Virgin Atlantic",
    flightNumber: "VS201",
    departureCode: "JFK",
    departureTime: "07:15 PM",
    arrivalCode: "LHR",
    arrivalTime: "08:00 AM",
    duration: "7h 45m",
    stops: 0,
    layovers: [],
    price: 749,
    class: "Economy",
  },
]

