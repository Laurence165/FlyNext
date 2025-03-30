import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/app/api/middleware";
import { PrismaClient } from "@prisma/client";
import { generateInvoicePDF } from "@/lib/pdfGenerator"; // TypeScript will automatically find .tsx files

const prisma = new PrismaClient();

// Basic credit card validation
function validateCreditCard(cardNumber: string, expiryDate: string, cvv: string) {
  // Check if card number contains only digits and is between 13-19 digits
  const cardNumberValid = /^\d{13,19}$/.test(cardNumber);
  
  // Check if expiry date is in format MM/YY or MM/YYYY
  const expiryDateValid = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/.test(expiryDate);
  
  // Extract month and year from expiry date
  const [month, year] = expiryDate.split('/');
  const expiryMonth = parseInt(month);
  let expiryYear = parseInt(year);
  if (year.length === 2) {
    expiryYear += 2000; // Convert 2-digit year to 4-digit
  }

  // Check if expiry date is in the future
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
  const currentYear = now.getFullYear();
  const dateValid = (expiryYear > currentYear) || 
                   (expiryYear === currentYear && expiryMonth >= currentMonth);
  
  // Check if CVV is 3 or 4 digits
  const cvvValid = /^\d{3,4}$/.test(cvv);

  return {
    valid: cardNumberValid && expiryDateValid && dateValid && cvvValid,
    errors: {
      cardNumber: !cardNumberValid ? 'Invalid card number' : null,
      expiryDate: !expiryDateValid ? 'Invalid expiry date format' : (!dateValid ? 'Card expired' : null),
      cvv: !cvvValid ? 'Invalid CVV' : null
    }
  };
}

// POST - Process checkout with credit card validation
export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticateToken(request);
    if (!(user instanceof Object)) {
      return user; // Return the error response if authentication failed
    }

    // Parse request body
    const body = await request.json();
    const { 
      bookingId, 
      cardNumber, 
      cardholderName,
      expiryDate, 
      cvv 
    } = body;

    // Validate required fields
    if (!bookingId || !cardNumber || !cardholderName || !expiryDate || !cvv) {
      return NextResponse.json(
        { error: "All payment fields are required" },
        { status: 400 }
      );
    }

    // Validate credit card details
    const cardValidation = validateCreditCard(cardNumber, expiryDate, cvv);
    if (!cardValidation.valid) {
      return NextResponse.json(
        { 
          error: "Invalid payment details",
          validationErrors: cardValidation.errors 
        },
        { status: 400 }
      );
    }

    // Extract user ID from authenticated user
    const userId = user.id;

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { 
        id: bookingId,
        userId: userId // Ensure booking belongs to the user
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

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Update booking status to CONFIRMED
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" }
    });

    // Generate invoice PDF using react-pdf/renderer
    const pdfPath = await generateInvoicePDF(booking, user);

    // Create invoice record in database
    const invoice = await prisma.invoice.create({
      data: {
        pdfPath,
        bookingId: booking.id
      }
    });

    // Create notification for successful payment
    await prisma.notification.create({
      data: {
        userId: userId,
        message: `Payment confirmed for booking #${bookingId.substring(0, 8)}. Invoice is ready.`,
        type: "BOOKING_CONFIRMED",
        read: false
      }
    });

    // Return success response with invoice details
    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      booking: {
        id: booking.id,
        status: "CONFIRMED",
        totalPrice: booking.totalPrice
      },
      invoice: {
        id: invoice.id,
        pdfPath: invoice.pdfPath
      }
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
