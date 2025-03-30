"use client"

import { Search } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function HotelSearch() {
  const [destination, setDestination] = useState("")
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = () => {
    setHasSearched(true)
  }

  return (
    <>
      <Card className="border-none shadow-md">
        <CardContent className="p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-2">
              <label htmlFor="hotel-destination" className="text-sm font-medium">
                Destination
              </label>
              <Input
                id="hotel-destination"
                placeholder="City or hotel name"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="check-in" className="text-sm font-medium">
                Check-in
              </label>
              <Input id="check-in" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="check-out" className="text-sm font-medium">
                Check-out
              </label>
              <Input id="check-out" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
            <div className="self-end">
              <Button size="lg" className="w-full" onClick={handleSearch}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-8">
        <p className="text-muted-foreground">
          {hasSearched ? "No hotels found matching your criteria" : "Search for hotels to see results"}
        </p>
      </div>
    </>
  )
}

