import fs from "fs";
import path from "path";
import ReactPDF from "@react-pdf/renderer";
import { Booking, User } from "@prisma/client";

// We need to import from the client-side components and adapt as needed
import { default as InvoicePDFComponent } from "../app/components/booking/invoice-pdf";

export async function generateInvoicePDF(
  booking: any,
  user: any
): Promise<string> {
  try {
    // Debug the booking data
    console.log("Generating PDF for booking:", {
      id: booking.id,
      userId: booking.userId,
      status: booking.status,
      flightsCount: booking.flights?.length || 0,
      reservationsCount: booking.reservations?.length || 0,
    });

    // Ensure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "invoices");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create a filename that includes timestamp to avoid collisions
    const timestamp = new Date().getTime();
    const filename = `invoice-${booking.id}-${timestamp}.pdf`;
    const outputPath = path.join(uploadsDir, filename);
    const publicPath = `/uploads/invoices/${filename}`;

    // Ensure booking data structure is complete before rendering
    const completeBookingData = {
      ...booking,
      createdAt: booking.createdAt || new Date().toISOString(),
      status: booking.status || "CONFIRMED",
      userId: booking.userId || user.id,
      // Ensure nested objects are properly structured
      flights: booking.flights?.map((flight: any) => ({
        ...flight,
        status: flight.status || "CONFIRMED",
        price: flight.price || 0
      })) || [],
      reservations: booking.reservations?.map((reservation: any) => ({
        ...reservation,
        status: reservation.status || "CONFIRMED",
        roomType: {
          ...reservation.roomType,
          pricePerNight: reservation.roomType?.pricePerNight || 0,
          hotel: {
            ...reservation.roomType?.hotel,
            name: reservation.roomType?.hotel?.name || "Unknown Hotel"
          }
        }
      })) || []
    };

    // Create the PDF document
    const pdfStream = await ReactPDF.renderToFile(
      InvoicePDFComponent({ booking: completeBookingData }) as any,
      outputPath
    );

    console.log("PDF generated successfully:", publicPath);
    return publicPath;
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(`Failed to generate invoice PDF: ${error.message}`);
  }
}
