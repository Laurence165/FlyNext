import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/app/api/middleware";
import { PrismaClient } from "@prisma/client";
import { generateInvoicePDF } from "@/lib/pdfGenerator";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticateToken(request);
    if (!(user instanceof Object)) {
      return user; // Return the error response if authentication failed
    }

    // Parse request body
    const body = await request.json();
    const { bookingIds } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: "bookingIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Find all the bookings
    const bookings = await prisma.booking.findMany({
      where: { 
        id: { in: bookingIds },
        userId: user.id, // Ensure bookings belong to the user
        status: "CONFIRMED" // Only generate invoices for confirmed bookings
      },
      include: {
        flights: true,
        reservations: {
          include: {
            roomType: {
              include: {
                hotel: true
              }
            }
          }
        }
      }
    });

    if (bookings.length === 0) {
      return NextResponse.json({ error: "No confirmed bookings found" }, { status: 404 });
    }

    // Generate invoice PDFs for each booking
    const invoiceResults = await Promise.all(bookings.map(async (booking) => {
      try {
        // Check if invoice already exists
        const existingInvoice = await prisma.invoice.findUnique({
          where: { bookingId: booking.id }
        });

        if (existingInvoice) {
          return {
            bookingId: booking.id,
            invoiceId: existingInvoice.id,
            pdfPath: existingInvoice.pdfPath,
            status: "existing"
          };
        }

        // Generate new invoice PDF
        const pdfPath = await generateInvoicePDF(booking, user);
        
        // Create invoice record in database
        const invoice = await prisma.invoice.create({
          data: {
            pdfPath,
            bookingId: booking.id
          }
        });

        // Create notification for invoice
        await prisma.notification.create({
          data: {
            userId: user.id,
            message: `Invoice for booking #${booking.id.substring(0, 8)} is ready.`,
            type: "INVOICE_READY",
            read: false
          }
        });

        return {
          bookingId: booking.id,
          invoiceId: invoice.id,
          pdfPath: invoice.pdfPath,
          status: "created"
        };
      } catch (error) {
        console.error(`Error generating invoice for booking ${booking.id}:`, error);
        return {
          bookingId: booking.id,
          error: "Failed to generate invoice",
          status: "failed"
        };
      }
    }));

    return NextResponse.json({
      success: true,
      message: "Invoice generation processed",
      invoices: invoiceResults
    });
  } catch (error) {
    console.error("Error generating invoices:", error);
    return NextResponse.json(
      { error: "Failed to generate invoices" },
      { status: 500 }
    );
  }
}
