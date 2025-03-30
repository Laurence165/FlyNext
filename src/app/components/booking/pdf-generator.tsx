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

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <Button variant="outline" disabled>
        <FileDown className="mr-2 h-4 w-4" />
        Loading Invoice...
      </Button>
    )
  }

  return (
    <PDFDownloadLink document={<InvoicePDF booking={booking} />} fileName={`invoice-${booking.id}.pdf`}>
      {({ loading }) => (
        <Button variant="outline" disabled={loading}>
          <FileDown className="mr-2 h-4 w-4" />
          {loading ? "Generating Invoice..." : "Download Invoice"}
        </Button>
      )}
    </PDFDownloadLink>
  )
}

