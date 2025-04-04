"use client"

import { useEffect, useState } from "react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Booking } from "./booking-context"
import InvoicePDF from "./invoice-pdf"

interface PDFGeneratorProps {
  booking: Booking
}

export default function PDFGenerator({ booking }: PDFGeneratorProps) {
  const [isClient, setIsClient] = useState(false)
  
  // Validate booking data
  const isValidBooking = booking && 
    (typeof booking === 'object') && 
    booking.id && 
    (
      (booking.flights && booking.flights.length > 0) || 
      (booking.reservations && booking.reservations.length > 0)
    )

  useEffect(() => {
    // Log the booking data during development to help debug
    console.log("PDFGenerator: Booking data:", booking)
    setIsClient(true)
  }, [booking])

  if (!isClient) {
    return (
      <Button variant="outline" disabled>
        <FileDown className="mr-2 h-4 w-4" />
        Loading Invoice...
      </Button>
    )
  }

  if (!isValidBooking) {
    console.error("PDFGenerator: Invalid booking data:", booking)
    return (
      <Button variant="outline" disabled>
        <FileDown className="mr-2 h-4 w-4" />
        Cannot Generate Invoice
      </Button>
    )
  }

  return (
    <PDFDownloadLink 
      document={<InvoicePDF booking={booking} />} 
      fileName={`invoice-${booking.id.substring(0, 8)}.pdf`}
    >
      {({ loading, error }) => {
        if (error) {
          console.error("PDFDownloadLink error:", error)
        }
        
        return (
          <Button variant="outline" disabled={loading}>
            <FileDown className="mr-2 h-4 w-4" />
            {loading ? "Generating Invoice..." : "Download Invoice"}
          </Button>
        )
      }}
    </PDFDownloadLink>
  )
}

