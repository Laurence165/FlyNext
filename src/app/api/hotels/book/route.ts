import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from "@/app/api/middleware";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    // Authenticate the user first
    const user = await authenticateToken(request);
    if (!(user instanceof Object)) {
        return user; // Return the error response if authentication failed
    }

    try {
        const body = await request.json();
        
        // Ensure all required fields are present
        if (!body.roomId || !body.checkInDate || !body.checkOutDate || !body.roomsBooked) {
            return NextResponse.json({ 
                error: "Room ID, check-in date, check-out date, and number of rooms are required" 
            }, { status: 400 });
        }

        // Parse dates
        const checkInDate = new Date(body.checkInDate);
        const checkOutDate = new Date(body.checkOutDate);

        // Validate dates
        if (checkInDate >= checkOutDate) {
            return NextResponse.json({ 
                error: "Check-out date must be after check-in date" 
            }, { status: 400 });
        }

        // Check if the room exists and is available
        const room = await prisma.room.findUnique({
            where: { id: body.roomId },
            include: { roomType: true }
        });

        if (!room) {
            return NextResponse.json({ error: "Room not found" }, { status: 404 });
        }

        if (room.availabilityStatus !== "available") {
            return NextResponse.json({ error: "Room is not available" }, { status: 400 });
        }

        // Calculate total price based on room type price and days of stay
        const daysOfStay = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = room.roomType.pricePerNight * daysOfStay * body.roomsBooked;

        // Create a booking transaction
        const booking = await prisma.$transaction(async (tx) => {
            // Create booking
            const newBooking = await tx.booking.create({
                data: {
                    totalPrice,
                    status: "CONFIRMED",
                    userId: user.id,
                }
            });

            // Create reservation
            const reservation = await tx.reservation.create({
                data: {
                    checkInDate,
                    checkOutDate,
                    roomsBooked: body.roomsBooked,
                    status: "CONFIRMED",
                    roomId: body.roomId,
                    bookingId: newBooking.id,
                }
            });

            // Update room availability if all rooms are booked
            if (body.updateRoomStatus) {
                await tx.room.update({
                    where: { id: body.roomId },
                    data: { availabilityStatus: "booked" }
                });
            }

            // Create notification
            await tx.notification.create({
                data: {
                    userId: user.id,
                    message: `Your hotel reservation has been confirmed. Check-in: ${checkInDate.toLocaleDateString()}, Check-out: ${checkOutDate.toLocaleDateString()}`,
                    type: "HOTEL_BOOKING",
                }
            });

            return {
                ...newBooking,
                reservation
            };
        });

        return NextResponse.json({
            bookingId: booking.id,
            bookingDetails: booking
        }, { status: 200 });
        
    } catch (error) {
        console.error("Error booking hotel:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, {
            status: 500
        });
    }
}
