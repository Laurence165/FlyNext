"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  ChevronDown,
  Plane,
  ArrowRight,
  Clock,
  Loader2,
  Search,
} from "lucide-react";
import { format, formatDistance } from "date-fns";
import { Airport } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/auth/auth-context";
import { useBooking } from "./booking/booking-context";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { flightAPI } from "../services/api";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Update the interface to match the API response format
interface AutocompleteResult {
  type: "city" | "airport";
  code: string;
  name: string;
  city?: string;
  country: string;
}

export default function FlightSearch() {
  const [tripType, setTripType] = useState<"oneWay" | "roundTrip">("roundTrip");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const [passengers, setPassengers] = useState(1);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFromSearching, setIsFromSearching] = useState(false);
  const [isToSearching, setIsToSearching] = useState(false);
  const [error, setError] = useState(null);
  const [flights, setFlights] = useState<{
    results?: any[];
    outbound?: any[];
    return?: any[];
  }>({});
  const [airports, setAirports] = useState<Airport[]>([]);
  const [suggestedFromAirports, setSuggestedFromAirports] = useState<
    AutocompleteResult[]
  >([]);
  const [suggestedToAirports, setSuggestedToAirports] = useState<
    AutocompleteResult[]
  >([]);
  const { addToCart } = useBooking();
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isBooking, setIsBooking] = useState(false);

  const [selectedOutbound, setSelectedOutbound] = useState<any>(null);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);

  // Debounce timeouts
  const fromSearchTimeout = useRef<NodeJS.Timeout | null>(null);
  const toSearchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchAirports() {
      try {
        const response = await fetch("/api/flights/airports");
        const data = await response.json();
        setAirports(data);

        // Initialize with just a few airports as default suggestions
        const initialSuggestions = data.slice(0, 5).map((airport: Airport) => ({
          type: "airport",
          code: airport.code,
          name: airport.name,
          city: airport.city?.name || "Unknown",
          country: airport.country,
        }));

        setSuggestedFromAirports(initialSuggestions);
        setSuggestedToAirports(initialSuggestions);
      } catch (error) {
        console.error("Error fetching airports:", error);
      }
    }

    fetchAirports();
  }, []);

  // Handle departure date changes
  const handleDepartureDateChange = (date: Date | undefined) => {
    setDepartureDate(date);

    // Reset return date if it's before the new departure date
    if (date && returnDate && returnDate < date) {
      setReturnDate(undefined);
      toast({
        title: "Return date reset",
        description: "Your return date must be after your departure date",
        variant: "default",
      });
    }
  };

  // Updated function to handle the autocomplete API response format
  const handleFromQueryChange = (query: string) => {
    setFromQuery(query);

    // Clear the previous timeout if it exists
    if (fromSearchTimeout.current) {
      clearTimeout(fromSearchTimeout.current);
    }

    // Only trigger search if query has at least 2 characters
    if (query.length < 2) {
      // Show a small set of default options if query is too short
      const initialSuggestions = airports.slice(0, 5).map((airport) => ({
        type: "airport" as const,
        code: airport.code,
        name: airport.name,
        city: airport.city?.name || "Unknown",
        country: airport.country,
      }));
      setSuggestedFromAirports(initialSuggestions);
      return;
    }

    setIsFromSearching(true);

    // Set a new timeout to debounce the API call
    fromSearchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/flights/autocomplete/?query=${encodeURIComponent(query)}`
        );
        const data = await response.json();

        // No need for conversion as the API returns the format we need
        setSuggestedFromAirports(data);
      } catch (error) {
        console.error("Error fetching airport suggestions:", error);
        // Fall back to client-side filtering if API fails
        const filtered = airports
          .filter(
            (airport) =>
              airport.name.toLowerCase().includes(query.toLowerCase()) ||
              airport.code.toLowerCase().includes(query.toLowerCase()) ||
              (airport.city?.name &&
                airport.city.name
                  .toLowerCase()
                  .includes(query.toLowerCase())) ||
              airport.country.toLowerCase().includes(query.toLowerCase())
          )
          .map((airport) => ({
            type: "airport" as const,
            code: airport.code,
            name: airport.name,
            city: airport.city?.name || "Unknown",
            country: airport.country,
          }));
        setSuggestedFromAirports(filtered.slice(0, 10));
      } finally {
        setIsFromSearching(false);
      }
    }, 300);
  };

  // Similar update for the "to" field
  const handleToQueryChange = (query: string) => {
    setToQuery(query);

    if (toSearchTimeout.current) {
      clearTimeout(toSearchTimeout.current);
    }

    if (query.length < 2) {
      const initialSuggestions = airports.slice(0, 5).map((airport) => ({
        type: "airport" as const,
        code: airport.code,
        name: airport.name,
        city: airport.city?.name || "Unknown",
        country: airport.country,
      }));
      setSuggestedToAirports(initialSuggestions);
      return;
    }

    setIsToSearching(true);

    toSearchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/flights/autocomplete/?query=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        setSuggestedToAirports(data);
      } catch (error) {
        console.error("Error fetching airport suggestions:", error);
        const filtered = airports
          .filter(
            (airport) =>
              airport.name.toLowerCase().includes(query.toLowerCase()) ||
              airport.code.toLowerCase().includes(query.toLowerCase()) ||
              (airport.city?.name &&
                airport.city.name
                  .toLowerCase()
                  .includes(query.toLowerCase())) ||
              airport.country.toLowerCase().includes(query.toLowerCase())
          )
          .map((airport) => ({
            type: "airport" as const,
            code: airport.code,
            name: airport.name,
            city: airport.city?.name || "Unknown",
            country: airport.country,
          }));
        setSuggestedToAirports(filtered.slice(0, 10));
      } finally {
        setIsToSearching(false);
      }
    }, 300);
  };

  const handleSearch = async () => {
    if (
      !from ||
      !to ||
      !departureDate ||
      (tripType === "roundTrip" && !returnDate)
    ) {
      toast({
        title: "Missing information",
        description:
          "Please fill in all required fields to search for flights.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSelectedOutbound(null);
      setSelectedReturn(null);

      let flightResults;

      if (tripType === "roundTrip") {
        const response = await fetch(
          `/api/flights/roundtrip?origin=${from}&destination=${to}&departDate=${
            departureDate.toISOString().split("T")[0]
          }&returnDate=${returnDate.toISOString().split("T")[0]}`
        );
        flightResults = await response.json();
      } else {
        const searchParams = {
          origin: from,
          destination: to,
          departDate: departureDate.toISOString().split("T")[0],
        };

        const response = await flightAPI.searchFlights(searchParams);
        flightResults = response;
      }

      setFlights(flightResults);
      setSearchPerformed(true);
    } catch (error) {
      console.error("Error searching flights:", error);
      setError("Unable to search flights. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookFlight = async (flightData: any) => {
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
        selectedFlight: flightData,
      };
      sessionStorage.setItem(
        "pendingFlightSearch",
        JSON.stringify(searchState)
      );
      router.push(
        `/login?returnTo=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }

    try {
      setIsBooking(true);

      let bookingData: any = { totalPrice: 0 };

      if (tripType === "oneWay") {
        const flightBooking = flightData.flights.map((flight: any) => ({
          afsFlightId: flight.id,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          source: flight.origin.code,
          destination: flight.destination.code,
          price: flight.price,
        }));

        bookingData.totalPrice = flightBooking.reduce(
          (sum: number, f: any) => sum + f.price,
          0
        );
        bookingData.flightBooking = flightBooking[0];
      } else {
        const outboundFlight = selectedOutbound.flights.map((flight: any) => ({
          afsFlightId: flight.id,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          source: flight.origin.code,
          destination: flight.destination.code,
          price: flight.price,
        }));

        const returnFlight = selectedReturn.flights.map((flight: any) => ({
          afsFlightId: flight.id,
          departureTime: flight.departureTime,
          arrivalTime: flight.arrivalTime,
          source: flight.origin.code,
          destination: flight.destination.code,
          price: flight.price,
        }));

        const allFlights = [...outboundFlight, ...returnFlight];
        bookingData.totalPrice = allFlights.reduce(
          (sum: number, f: any) => sum + f.price,
          0
        );
        bookingData.flightBooking = allFlights;
      }

      const booking = await addToCart(bookingData);

      if (booking) {
        toast({
          title: "Success!",
          description:
            "Flight added to your cart. Proceed to checkout to complete your booking.",
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
        description:
          "There was an error adding the flight to your cart. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsBooking(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedOutbound || !selectedReturn) return 0;

    const outboundTotal = selectedOutbound.flights.reduce(
      (sum: number, flight: any) => sum + flight.price,
      0
    );
    const returnTotal = selectedReturn.flights.reduce(
      (sum: number, flight: any) => sum + flight.price,
      0
    );

    return outboundTotal + returnTotal;
  };

  // Update the display of selected airports in the "From" button
  const getFromDisplayText = () => {
    if (!from) return "Select departure";

    // Try to find the airport in our suggestions first
    const fromSuggestion = suggestedFromAirports.find(
      (item) => item.code === from
    );
    if (fromSuggestion) {
      return fromSuggestion.type === "city"
        ? `${fromSuggestion.name}, ${fromSuggestion.country}`
        : `${fromSuggestion.name} (${fromSuggestion.code})`;
    }

    // Fall back to airports list
    const fromAirport = airports.find((airport) => airport.code === from);
    return fromAirport ? `${fromAirport.name} (${fromAirport.code})` : from;
  };

  // Update the display of selected airports in the "To" button
  const getToDisplayText = () => {
    if (!to) return "Select destination";

    // Try to find the airport in our suggestions first
    const toSuggestion = suggestedToAirports.find((item) => item.code === to);
    if (toSuggestion) {
      return toSuggestion.type === "city"
        ? `${toSuggestion.name}, ${toSuggestion.country}`
        : `${toSuggestion.name} (${toSuggestion.code})`;
    }

    // Fall back to airports list
    const toAirport = airports.find((airport) => airport.code === to);
    return toAirport ? `${toAirport.name} (${toAirport.code})` : to;
  };

  return (
    <div className="space-y-8">
      <Card className="border shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">
            Find Your Flight
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="space-y-6">
            <RadioGroup
              defaultValue={tripType}
              className="flex space-x-4"
              onValueChange={(value) =>
                setTripType(value as "oneWay" | "roundTrip")
              }
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                      <span className="truncate max-w-[200px] text-left">
                        {getFromDisplayText()}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandInput
                          placeholder="Search airport or city..."
                          value={fromQuery}
                          onValueChange={handleFromQueryChange}
                          className="flex-1"
                        />
                      </div>
                      <CommandList>
                        {isFromSearching ? (
                          <div className="py-6 text-center text-sm">
                            <Loader2 className="mx-auto h-4 w-4 animate-spin opacity-70" />
                            <p className="mt-2 text-muted-foreground">
                              Searching airports...
                            </p>
                          </div>
                        ) : suggestedFromAirports.length === 0 ? (
                          <CommandEmpty>No airport or city found.</CommandEmpty>
                        ) : (
                          <CommandGroup className="max-h-[300px] overflow-auto">
                            {suggestedFromAirports.map((item, index) => (
                              <CommandItem
                                key={`${item.type}-${item.code}-${index}`}
                                value={item.code}
                                onSelect={(currentValue) => {
                                  setFrom(currentValue);
                                  setFromQuery("");
                                  setIsFromOpen(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  {item.type === "city" ? (
                                    <>
                                      <span className="font-medium">
                                        {item.name}, {item.country}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        All airports in {item.name}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-medium">
                                        {item.city}, {item.country}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {item.name} ({item.code})
                                      </span>
                                    </>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
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
                      <span className="truncate max-w-[200px] text-left">
                        {getToDisplayText()}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <Command>
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandInput
                          placeholder="Search airport or city..."
                          value={toQuery}
                          onValueChange={handleToQueryChange}
                          className="flex-1"
                        />
                      </div>
                      <CommandList>
                        {isToSearching ? (
                          <div className="py-6 text-center text-sm">
                            <Loader2 className="mx-auto h-4 w-4 animate-spin opacity-70" />
                            <p className="mt-2 text-muted-foreground">
                              Searching airports...
                            </p>
                          </div>
                        ) : suggestedToAirports.length === 0 ? (
                          <CommandEmpty>No airport or city found.</CommandEmpty>
                        ) : (
                          <CommandGroup className="max-h-[300px] overflow-auto">
                            {suggestedToAirports.map((item, index) => (
                              <CommandItem
                                key={`${item.type}-${item.code}-${index}`}
                                value={item.code}
                                onSelect={(currentValue) => {
                                  setTo(currentValue);
                                  setToQuery("");
                                  setIsToOpen(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  {item.type === "city" ? (
                                    <>
                                      <span className="font-medium">
                                        {item.name}, {item.country}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        All airports in {item.name}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-medium">
                                        {item.city}, {item.country}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {item.name} ({item.code})
                                      </span>
                                    </>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Departure</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {departureDate && typeof window !== "undefined"
                        ? format(departureDate, "MMM d, yyyy")
                        : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={departureDate}
                      onSelect={handleDepartureDateChange}
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
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={!departureDate}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {returnDate && typeof window !== "undefined"
                          ? format(returnDate, "MMM d, yyyy")
                          : departureDate
                          ? "Select return date"
                          : "Set departure first"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={returnDate}
                        onSelect={setReturnDate}
                        initialFocus
                        disabled={(date) =>
                          date < new Date() ||
                          (departureDate ? date < departureDate : true)
                        }
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
                disabled={
                  !from ||
                  !to ||
                  !departureDate ||
                  (tripType === "roundTrip" && !returnDate) ||
                  isLoading
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Plane className="mr-2 h-4 w-4" />
                    Search Flights
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p className="text-lg">Searching for the best flights for you...</p>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-center text-red-600">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {searchPerformed && !isLoading && (
        <div className="space-y-6">
          {tripType === "oneWay" ? (
            <OneWayFlightResults
              from={from}
              to={to}
              departureDate={departureDate}
              flights={flights}
              airports={airports}
              onBookFlight={handleBookFlight}
              isBooking={isBooking}
              isAuthenticated={isAuthenticated}
            />
          ) : (
            <RoundTripFlightResults
              from={from}
              to={to}
              departureDate={departureDate}
              returnDate={returnDate}
              flights={flights}
              airports={airports}
              selectedOutbound={selectedOutbound}
              selectedReturn={selectedReturn}
              setSelectedOutbound={setSelectedOutbound}
              setSelectedReturn={setSelectedReturn}
              onBookFlight={handleBookFlight}
              isBooking={isBooking}
              isAuthenticated={isAuthenticated}
              totalPrice={calculateTotalPrice()}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface OneWayFlightResultsProps {
  from: string;
  to: string;
  departureDate?: Date;
  flights: {
    results?: any[];
  };
  airports: Airport[];
  onBookFlight: (result: any) => Promise<void>;
  isBooking: boolean;
  isAuthenticated: boolean;
}

function OneWayFlightResults({
  from,
  to,
  departureDate,
  flights,
  airports,
  onBookFlight,
  isBooking,
  isAuthenticated,
}: OneWayFlightResultsProps) {
  const fromAirport = airports.find((airport) => airport.code === from);
  const toAirport = airports.find((airport) => airport.code === to);

  const flightResults = flights.results || [];

  const sortedResults = [...flightResults].sort((a, b) => {
    const priceA = a.flights.reduce(
      (sum: number, flight: any) => sum + flight.price,
      0
    );
    const priceB = b.flights.reduce(
      (sum: number, flight: any) => sum + flight.price,
      0
    );
    return priceA - priceB;
  });

  if (sortedResults.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-lg">
            No flights found for your search criteria. Please try different
            dates or airports.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          {fromAirport?.city?.name || from} to {toAirport?.city?.name || to}
          {departureDate && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {format(departureDate, "EEE, MMM d, yyyy")}
            </span>
          )}
        </h2>
        <Badge variant="outline" className="flex items-center gap-1">
          <Plane className="h-3 w-3" />
          {sortedResults.length} Flights Found
        </Badge>
      </div>

      <div className="space-y-4">
        {sortedResults.map((result, index) => {
          const totalPrice = result.flights.reduce(
            (sum: number, flight: any) => sum + flight.price,
            0
          );
          const currency = result.flights[0]?.currency || "USD";

          const firstFlight = result.flights[0];
          const lastFlight = result.flights[result.flights.length - 1];
          const departureTime = new Date(firstFlight.departureTime);
          const arrivalTime = new Date(lastFlight.arrivalTime);
          const durationMs = arrivalTime.getTime() - departureTime.getTime();
          const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
          const durationMinutes = Math.floor(
            (durationMs % (1000 * 60 * 60)) / (1000 * 60)
          );

          return (
            <Card
              key={index}
              className="overflow-hidden hover:border-primary/50 transition-colors"
            >
              <CardContent className="p-0">
                <div className="bg-muted/20 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Plane className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {result.flights[0].airline.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.legs > 1
                          ? `${result.legs - 1} stop${
                              result.legs > 2 ? "s" : ""
                            }`
                          : "Direct Flight"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {currency} {totalPrice.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        per passenger
                      </p>
                    </div>
                    <Button
                      onClick={() => onBookFlight(result)}
                      disabled={isBooking}
                      className="whitespace-nowrap"
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding to Cart
                        </>
                      ) : isAuthenticated ? (
                        "Add to Cart"
                      ) : (
                        "Login & Book"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-semibold">
                        {format(new Date(firstFlight.departureTime), "HH:mm")}
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-muted-foreground mb-1">
                          {durationHours}h {durationMinutes}m
                        </div>
                        <div className="relative w-24">
                          <div className="absolute h-[2px] bg-muted-foreground/30 w-full top-1/2 -translate-y-1/2"></div>
                          <div className="absolute right-0 h-2 w-2 rounded-full bg-muted-foreground top-1/2 -translate-y-1/2"></div>
                        </div>
                      </div>
                      <div className="text-2xl font-semibold">
                        {format(new Date(lastFlight.arrivalTime), "HH:mm")}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground text-right">
                      <p>
                        Flight{" "}
                        {result.flights
                          .map((f: any) => f.flightNumber)
                          .join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium">
                        {firstFlight.origin.city} ({firstFlight.origin.code})
                      </p>
                      <p>
                        {format(
                          new Date(firstFlight.departureTime),
                          "EEE, MMM d"
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {lastFlight.destination.city} (
                        {lastFlight.destination.code})
                      </p>
                      <p>
                        {format(new Date(lastFlight.arrivalTime), "EEE, MMM d")}
                      </p>
                    </div>
                  </div>

                  {result.flights.length > 1 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Flight Details</p>
                      {result.flights.map(
                        (flight: any, flightIndex: number) => (
                          <div key={flight.id} className="mb-3 last:mb-0">
                            <div className="flex items-center justify-between text-sm">
                              <div>
                                <p>
                                  {flight.airline.name} {flight.flightNumber}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(flight.departureTime),
                                    "HH:mm"
                                  )}{" "}
                                  -{" "}
                                  {format(
                                    new Date(flight.arrivalTime),
                                    "HH:mm"
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                <p>
                                  {flight.origin.code} →{" "}
                                  {flight.destination.code}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistance(
                                    new Date(flight.departureTime),
                                    new Date(flight.arrivalTime)
                                  )}
                                </p>
                              </div>
                            </div>

                            {flightIndex < result.flights.length - 1 && (
                              <div className="my-2 pl-4 border-l-2 border-dashed border-muted-foreground/30 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                <span>
                                  {formatDistance(
                                    new Date(flight.arrivalTime),
                                    new Date(
                                      result.flights[
                                        flightIndex + 1
                                      ].departureTime
                                    )
                                  )}{" "}
                                  layover in {flight.destination.city}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

interface RoundTripFlightResultsProps {
  from: string;
  to: string;
  departureDate?: Date;
  returnDate?: Date;
  flights: {
    outbound?: any[];
    return?: any[];
  };
  airports: Airport[];
  selectedOutbound: any;
  selectedReturn: any;
  setSelectedOutbound: (flight: any) => void;
  setSelectedReturn: (flight: any) => void;
  onBookFlight: (result: any) => Promise<void>;
  isBooking: boolean;
  isAuthenticated: boolean;
  totalPrice: number;
}

function RoundTripFlightResults({
  from,
  to,
  departureDate,
  returnDate,
  flights,
  airports,
  selectedOutbound,
  selectedReturn,
  setSelectedOutbound,
  setSelectedReturn,
  onBookFlight,
  isBooking,
  isAuthenticated,
  totalPrice,
}: RoundTripFlightResultsProps) {
  const fromAirport = airports.find((airport) => airport.code === from);
  const toAirport = airports.find((airport) => airport.code === to);

  const outboundFlights = flights.outbound || [];
  const returnFlights = flights.return || [];

  const sortedOutbound = [...outboundFlights].sort((a, b) => {
    const priceA = a.flights.reduce(
      (sum: number, flight: any) => sum + flight.price,
      0
    );
    const priceB = b.flights.reduce(
      (sum: number, flight: any) => sum + flight.price,
      0
    );
    return priceA - priceB;
  });

  const sortedReturn = [...returnFlights].sort((a, b) => {
    const priceA = a.flights.reduce(
      (sum: number, flight: any) => sum + flight.price,
      0
    );
    const priceB = b.flights.reduce(
      (sum: number, flight: any) => sum + flight.price,
      0
    );
    return priceA - priceB;
  });

  const handleBookCompleteTrip = async () => {
    if (!selectedOutbound || !selectedReturn) {
      return;
    }

    const combinedResult = {
      flights: [...selectedOutbound.flights, ...selectedReturn.flights],
    };

    await onBookFlight(combinedResult);
  };

  if (outboundFlights.length === 0 && returnFlights.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-lg">
            No flights found for your search criteria. Please try different
            dates or airports.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium">
                {fromAirport?.city?.name || from} ↔{" "}
                {toAirport?.city?.name || to}
              </p>
              <p className="text-xs text-muted-foreground">
                {departureDate && format(departureDate, "MMM d")} -{" "}
                {returnDate && format(returnDate, "MMM d")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Badge
                variant={selectedOutbound ? "default" : "outline"}
                className="mr-2"
              >
                1
              </Badge>
              <span className="text-sm">Outbound Flight</span>
              {selectedOutbound && (
                <span className="text-xs text-muted-foreground ml-2">
                  Selected
                </span>
              )}
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center">
              <Badge
                variant={selectedReturn ? "default" : "outline"}
                className="mr-2"
              >
                2
              </Badge>
              <span className="text-sm">Return Flight</span>
              {selectedReturn && (
                <span className="text-xs text-muted-foreground ml-2">
                  Selected
                </span>
              )}
            </div>
            {selectedOutbound && selectedReturn && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <p className="text-sm font-bold">
                    Total: ${totalPrice.toLocaleString()}
                  </p>
                </div>
                <Button onClick={handleBookCompleteTrip} disabled={isBooking}>
                  {isBooking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding to Cart
                    </>
                  ) : isAuthenticated ? (
                    "Add to Cart"
                  ) : (
                    "Login & Book"
                  )}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="outbound">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="outbound" className="flex-1">
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Outbound Flight</span>
              <span className="text-xs text-muted-foreground">
                {departureDate && format(departureDate, "EEE, MMM d")} •{" "}
                {fromAirport?.code || from} → {toAirport?.code || to}
              </span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="return" className="flex-1">
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Return Flight</span>
              <span className="text-xs text-muted-foreground">
                {returnDate && format(returnDate, "EEE, MMM d")} •{" "}
                {toAirport?.code || to} → {fromAirport?.code || from}
              </span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outbound" className="mt-0 space-y-4">
          <h2 className="text-xl font-semibold">Select your outbound flight</h2>

          {sortedOutbound.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p>
                  No outbound flights found. Please try a different date or
                  route.
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedOutbound.map((result, index) => {
              const totalPrice = result.flights.reduce(
                (sum: number, flight: any) => sum + flight.price,
                0
              );
              const currency = result.flights[0]?.currency || "USD";

              const firstFlight = result.flights[0];
              const lastFlight = result.flights[result.flights.length - 1];
              const departureTime = new Date(firstFlight.departureTime);
              const arrivalTime = new Date(lastFlight.arrivalTime);
              const durationMs =
                arrivalTime.getTime() - departureTime.getTime();
              const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
              const durationMinutes = Math.floor(
                (durationMs % (1000 * 60 * 60)) / (1000 * 60)
              );

              const isSelected =
                selectedOutbound &&
                selectedOutbound.flights[0].id === result.flights[0].id &&
                selectedOutbound.flights[result.flights.length - 1].id ===
                  result.flights[result.flights.length - 1].id;

              return (
                <Card
                  key={index}
                  className={`overflow-hidden transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary ring-1 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedOutbound(result)}
                >
                  <CardContent className="p-0">
                    <div
                      className={`p-4 flex justify-between items-center ${
                        isSelected ? "bg-primary/10" : "bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 ${
                            isSelected ? "bg-primary/20" : "bg-primary/10"
                          } rounded-full`}
                        >
                          <Plane className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {result.flights[0].airline.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.legs > 1
                              ? `${result.legs - 1} stop${
                                  result.legs > 2 ? "s" : ""
                                }`
                              : "Direct Flight"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {currency} {totalPrice.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            per passenger
                          </p>
                        </div>
                        <Badge variant={isSelected ? "default" : "outline"}>
                          {isSelected ? "Selected" : "Select"}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-semibold">
                            {format(
                              new Date(firstFlight.departureTime),
                              "HH:mm"
                            )}
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              {durationHours}h {durationMinutes}m
                            </div>
                            <div className="relative w-24">
                              <div className="absolute h-[2px] bg-muted-foreground/30 w-full top-1/2 -translate-y-1/2"></div>
                              <div className="absolute right-0 h-2 w-2 rounded-full bg-muted-foreground top-1/2 -translate-y-1/2"></div>
                            </div>
                          </div>
                          <div className="text-2xl font-semibold">
                            {format(new Date(lastFlight.arrivalTime), "HH:mm")}
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground text-right">
                          <p>
                            Flight{" "}
                            {result.flights
                              .map((f: any) => f.flightNumber)
                              .join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm text-muted-foreground">
                        <div>
                          <p className="font-medium">
                            {firstFlight.origin.city} ({firstFlight.origin.code}
                            )
                          </p>
                          <p>
                            {format(
                              new Date(firstFlight.departureTime),
                              "EEE, MMM d"
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {lastFlight.destination.city} (
                            {lastFlight.destination.code})
                          </p>
                          <p>
                            {format(
                              new Date(lastFlight.arrivalTime),
                              "EEE, MMM d"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="return" className="mt-0 space-y-4">
          <h2 className="text-xl font-semibold">Select your return flight</h2>

          {sortedReturn.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p>
                  No return flights found. Please try a different date or route.
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedReturn.map((result, index) => {
              const totalPrice = result.flights.reduce(
                (sum: number, flight: any) => sum + flight.price,
                0
              );
              const currency = result.flights[0]?.currency || "USD";

              const firstFlight = result.flights[0];
              const lastFlight = result.flights[result.flights.length - 1];
              const departureTime = new Date(firstFlight.departureTime);
              const arrivalTime = new Date(lastFlight.arrivalTime);
              const durationMs =
                arrivalTime.getTime() - departureTime.getTime();
              const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
              const durationMinutes = Math.floor(
                (durationMs % (1000 * 60 * 60)) / (1000 * 60)
              );

              const isSelected =
                selectedReturn &&
                selectedReturn.flights[0].id === result.flights[0].id &&
                selectedReturn.flights[result.flights.length - 1].id ===
                  result.flights[result.flights.length - 1].id;

              return (
                <Card
                  key={index}
                  className={`overflow-hidden transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary ring-1 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedReturn(result)}
                >
                  <CardContent className="p-0">
                    <div
                      className={`p-4 flex justify-between items-center ${
                        isSelected ? "bg-primary/10" : "bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 ${
                            isSelected ? "bg-primary/20" : "bg-primary/10"
                          } rounded-full`}
                        >
                          <Plane className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {result.flights[0].airline.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.legs > 1
                              ? `${result.legs - 1} stop${
                                  result.legs > 2 ? "s" : ""
                                }`
                              : "Direct Flight"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {currency} {totalPrice.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            per passenger
                          </p>
                        </div>
                        <Badge variant={isSelected ? "default" : "outline"}>
                          {isSelected ? "Selected" : "Select"}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-semibold">
                            {format(
                              new Date(firstFlight.departureTime),
                              "HH:mm"
                            )}
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              {durationHours}h {durationMinutes}m
                            </div>
                            <div className="relative w-24">
                              <div className="absolute h-[2px] bg-muted-foreground/30 w-full top-1/2 -translate-y-1/2"></div>
                              <div className="absolute right-0 h-2 w-2 rounded-full bg-muted-foreground top-1/2 -translate-y-1/2"></div>
                            </div>
                          </div>
                          <div className="text-2xl font-semibold">
                            {format(new Date(lastFlight.arrivalTime), "HH:mm")}
                          </div>
                        </div>

                        <div className="text-sm text-muted-foreground text-right">
                          <p>
                            Flight{" "}
                            {result.flights
                              .map((f: any) => f.flightNumber)
                              .join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between text-sm text-muted-foreground">
                        <div>
                          <p className="font-medium">
                            {firstFlight.origin.city} ({firstFlight.origin.code}
                            )
                          </p>
                          <p>
                            {format(
                              new Date(firstFlight.departureTime),
                              "EEE, MMM d"
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {lastFlight.destination.city} (
                            {lastFlight.destination.code})
                          </p>
                          <p>
                            {format(
                              new Date(lastFlight.arrivalTime),
                              "EEE, MMM d"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
