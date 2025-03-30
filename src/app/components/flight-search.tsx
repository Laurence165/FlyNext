"use client"

import { useState } from "react"
import { Calendar, ChevronDown, Plane } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

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

  const handleSearch = () => {
    // Validate form
    if (!from || !to || !departureDate || (tripType === "roundTrip" && !returnDate)) {
      return
    }

    setShowResults(true)
  }

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
                              key={airport.code}
                              value={airport.code}
                              onSelect={(currentValue) => {
                                setFrom(currentValue)
                                setIsFromOpen(false)
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{airport.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {airport.code} - {airport.city}, {airport.country}
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
                              key={airport.code}
                              value={airport.code}
                              onSelect={(currentValue) => {
                                setTo(currentValue)
                                setIsToOpen(false)
                              }}
                            >
                              <div className="flex flex-col">
                                <span>{airport.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {airport.code} - {airport.city}, {airport.country}
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

      {showResults && (
        <FlightResults from={from} to={to} departureDate={departureDate} returnDate={returnDate} tripType={tripType} />
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
}

function FlightResults({ from, to, departureDate, returnDate, tripType }: FlightResultsProps) {
  const fromAirport = airports.find((airport) => airport.code === from)
  const toAirport = airports.find((airport) => airport.code === to)

  // Format dates safely
  const formatDate = (date?: Date) => {
    if (!date || typeof window === "undefined") return ""
    return format(date, "MMM d, yyyy")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {fromAirport?.city} to {toAirport?.city}
          {departureDate && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {formatDate(departureDate)}
              {tripType === "roundTrip" && returnDate && ` - ${formatDate(returnDate)}`}
            </span>
          )}
        </h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            Filter
          </Button>
          <Button variant="outline" size="sm">
            Sort: Price
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {mockFlights.map((flight) => (
          <Card key={flight.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Plane className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{flight.airline}</p>
                        <p className="text-xs text-muted-foreground">Flight {flight.flightNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${flight.price}</p>
                      <p className="text-xs text-muted-foreground">{flight.class}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
                    <div className="text-right">
                      <p className="font-medium">{flight.departureTime}</p>
                      <p className="text-xs text-muted-foreground">{flight.departureCode}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="text-xs text-muted-foreground mb-1">{flight.duration}</div>
                      <div className="w-full flex items-center">
                        <div className="h-[2px] flex-1 bg-muted"></div>
                        <div className="mx-1 text-xs text-muted-foreground">
                          {flight.stops > 0 ? `${flight.stops} stop${flight.stops > 1 ? "s" : ""}` : "Direct"}
                        </div>
                        <div className="h-[2px] flex-1 bg-muted"></div>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{flight.arrivalTime}</p>
                      <p className="text-xs text-muted-foreground">{flight.arrivalCode}</p>
                    </div>
                  </div>

                  {flight.stops > 0 && (
                    <div className="bg-muted/50 p-2 rounded text-sm">
                      <p className="font-medium">Layover Details:</p>
                      {flight.layovers.map((layover, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          {layover.duration} in {layover.airport} ({layover.code})
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end md:border-l md:pl-6">
                  <Button>Select</Button>
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

