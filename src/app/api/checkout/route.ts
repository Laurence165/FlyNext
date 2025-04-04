import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/app/api/middleware";
import { PrismaClient } from "@prisma/client";

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
  console.log("Checkout API route called");
  try {
    // Authenticate the user
    console.log("Authenticating user...");
    const user = await authenticateToken(request);
    console.log("Authentication result:", user instanceof Response ? "Failed" : "Success");
    
    if (!(user instanceof Object)) {
      console.log("Authentication failed, returning error response");
      return user; // Return the error response if authentication failed
    }

    // Parse request body
    console.log("Parsing request body...");
    const body = await request.json();
    console.log("Request body received:", JSON.stringify({
      bookingIds: body.bookingIds,
      hasCardNumber: !!body.cardNumber,
      hasCardholderName: !!body.cardholderName,
      hasExpiryDate: !!body.expiryDate,
      hasCvv: !!body.cvv
    }));
    
    const { 
      bookingIds, // Now an array of booking IDs
      cardNumber, 
      cardholderName,
      expiryDate, 
      cvv 
    } = body;

    // Validate required fields
    console.log("Validating required fields...");
    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0 || 
        !cardNumber || !cardholderName || !expiryDate || !cvv) {
      console.log("Validation failed - missing required fields");
      return NextResponse.json(
        { error: "All payment fields are required and bookingIds must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate credit card details
    console.log("Validating credit card details...");
    const cardValidation = validateCreditCard(cardNumber, expiryDate, cvv);
    console.log("Card validation result:", cardValidation.valid ? "Valid" : "Invalid", 
      !cardValidation.valid ? cardValidation.errors : "");
    
    if (!cardValidation.valid) {
      console.log("Card validation failed, returning error");
      return NextResponse.json(
        { 
          error: "Invalid payment details",
          validationErrors: cardValidation.errors 
        },
        { status: 400 }
      );
    }

    // Extract user ID from authenticated user
    console.log("User ID:", user.id);
    const userId = user.id;

    // Find all the bookings
    console.log("Finding bookings for IDs:", bookingIds);
    const bookings = await prisma.booking.findMany({
      where: { 
        id: { in: bookingIds },
        userId: userId, // Ensure bookings belong to the user
        status: "PENDING" // Only process pending bookings
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
    console.log(`Found ${bookings.length} bookings`);

    // Check if any bookings were found
    if (bookings.length === 0) {
      return NextResponse.json({ 
        error: "No pending bookings found for checkout" 
      }, { status: 404 });
    }

    // Log the found bookings vs requested bookings
    console.log(`Found ${bookings.length} bookings out of ${bookingIds.length} requested`);
    
    // Get the IDs of bookings that were found
    const foundBookingIds = bookings.map(booking => booking.id);
    
    // Find which booking IDs were not found
    const missingBookingIds = bookingIds.filter(id => !foundBookingIds.includes(id));
    
    if (missingBookingIds.length > 0) {
      console.log("Missing booking IDs:", missingBookingIds);
    }

    // Process payment (mock payment processing)
    // In a real application, you would integrate with a payment gateway here

    // Update booking status to CONFIRMED for all found bookings
    const updatePromises = bookings.map(booking => 
      prisma.booking.update({
        where: { id: booking.id },
        data: { 
          status: "CONFIRMED"
        }
      })
    );

    // Wait for all updates to complete
    const updatedBookings = await Promise.all(updatePromises);

    // Generate invoices for each booking
    const invoicePromises = updatedBookings.map(async (booking) => {
      // Call the invoice generation API
      const invoiceResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/invoices/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || ''
        },
        body: JSON.stringify({ bookingId: booking.id })
      });
      
      return invoiceResponse.json();
    });

    // Wait for all invoices to be generated
    const invoiceResults = await Promise.all(invoicePromises);

    // Create notifications for each confirmed booking
    const notificationPromises = updatedBookings.map(booking => 
      prisma.notification.create({
        data: {
          userId: userId,
          message: `Your booking #${booking.id.substring(0, 8)} has been confirmed.`,
          type: "BOOKING_CONFIRMED",
          read: false
        }
      })
    );

    // Wait for all notifications to be created
    await Promise.all(notificationPromises);

    // Return success response with the processed bookings
    console.log("Checkout completed successfully");
    return NextResponse.json({
      success: true,
      message: `${updatedBookings.length} bookings have been confirmed`,
      bookings: updatedBookings.map(booking => ({
        id: booking.id,
        status: booking.status,
        totalPrice: booking.totalPrice
      })),
      missingBookings: missingBookingIds.length > 0 ? missingBookingIds : undefined
    });
  } catch (error) {
    // Don't use console.error at all since that seems to be causing issues
    console.log("Error processing checkout:", error ? String(error) : "Unknown error");
    
    // Simplify error logging to avoid any syntax issues
    try {
      if (error) {
        console.log("Error name:", error.name || "No name");
        console.log("Error message:", error.message || "No message");
      }
    } catch (logError) {
      console.log("Failed to log error details");
    }
    
    return NextResponse.json(
      { error: "Failed to process checkout" },
      { status: 500 }
    );
  }
}
