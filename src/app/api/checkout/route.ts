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
  try {
    // Authenticate the user
    const user = await authenticateToken(request);
    if (!(user instanceof Object)) {
      return user; // Return the error response if authentication failed
    }

    // Parse request body
    const body = await request.json();
    const { 
      bookingIds, // Now an array of booking IDs
      cardNumber, 
      cardholderName,
      expiryDate, 
      cvv 
    } = body;

    // Validate required fields
    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0 || 
        !cardNumber || !cardholderName || !expiryDate || !cvv) {
      return NextResponse.json(
        { error: "All payment fields are required and bookingIds must be a non-empty array" },
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

    // Find all the bookings
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

    // Check if all bookings were found
    if (bookings.length !== bookingIds.length) {
      return NextResponse.json({ 
        error: "One or more bookings not found or already processed" 
      }, { status: 404 });
    }

    // Calculate total amount
    const totalAmount = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

    // Create a payment record
    const payment = await prisma.payment.create({
      data: {
        amount: totalAmount,
        status: "COMPLETED",
        paymentMethod: "credit_card",
        userId: userId
      }
    });

    // Update all bookings to CONFIRMED status and link to payment
    const updatedBookings = await Promise.all(bookings.map(booking => 
      prisma.booking.update({
        where: { id: booking.id },
        data: { 
          status: "CONFIRMED",
          paymentId: payment.id
        }
      })
    ));

    // Create notifications for successful payment
    await prisma.notification.create({
      data: {
        userId: userId,
        message: `Payment of $${totalAmount.toFixed(2)} confirmed for ${bookings.length} booking(s). Invoices will be generated shortly.`,
        type: "PAYMENT_CONFIRMED",
        read: false
      }
    });

    // Trigger invoice generation asynchronously
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({ bookingIds })
    }).catch(err => console.error("Error triggering invoice generation:", err));

    // Return success response with payment details
    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status
      },
      bookings: updatedBookings.map(booking => ({
        id: booking.id,
        status: booking.status,
        totalPrice: booking.totalPrice
      }))
    });
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
