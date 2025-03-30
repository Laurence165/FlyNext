import { prisma } from "@/utils/db";

/**
 * Check if rooms are available for the given date range
 */
export async function checkRoomAvailability(
  roomTypeId: string,
  checkInDate: Date,
  checkOutDate: Date,
  roomsRequested: number
): Promise<{ available: boolean; unavailableDates?: Date[] }> {
  try {
    // Get the room type to check total rooms available
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId }
    });

    if (!roomType) {
      throw new Error("Room type not found");
    }

    // Base availability is the total rooms for this room type
    const baseAvailability = roomType.totalRooms;
    
    if (baseAvailability < roomsRequested) {
      return { available: false };
    }

    // Get all dates in the range
    const dates = getDatesInRange(checkInDate, checkOutDate);
    
    // Get existing availability records for these dates
    const existingAvailability = await prisma.roomAvailability.findMany({
      where: {
        roomTypeId,
        date: {
          in: dates
        }
      }
    });

    // Create a map for quick lookup
    const availabilityMap = new Map();
    existingAvailability.forEach(record => {
      availabilityMap.set(record.date.toISOString().split('T')[0], record.availableRooms);
    });

    // Check each date for availability
    const unavailableDates: Date[] = [];
    
    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];
      // If we have a record, use that availability, otherwise use base availability
      const availableRooms = availabilityMap.has(dateKey) 
        ? availabilityMap.get(dateKey) 
        : baseAvailability;
      
      if (availableRooms < roomsRequested) {
        unavailableDates.push(date);
      }
    }

    return {
      available: unavailableDates.length === 0,
      unavailableDates: unavailableDates.length > 0 ? unavailableDates : undefined
    };
  } catch (error) {
    console.error("Error checking room availability:", error);
    throw error;
  }
}

/**
 * Update room availability after a booking is made
 */
export async function updateRoomAvailability(
  roomTypeId: string,
  checkInDate: Date,
  checkOutDate: Date,
  roomsBooked: number
): Promise<void> {
  try {
    // Get the room type to check total rooms
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId }
    });

    if (!roomType) {
      throw new Error("Room type not found");
    }

    // Get all dates in the range
    const dates = getDatesInRange(checkInDate, checkOutDate);
    
    // Get existing availability records for these dates
    const existingAvailability = await prisma.roomAvailability.findMany({
      where: {
        roomTypeId,
        date: {
          in: dates
        }
      }
    });

    // Create a map for quick lookup
    const availabilityMap = new Map();
    existingAvailability.forEach(record => {
      availabilityMap.set(record.date.toISOString().split('T')[0], record);
    });

    // Update or create availability records for each date
    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];
      
      if (availabilityMap.has(dateKey)) {
        // Update existing record
        const record = availabilityMap.get(dateKey);
        await prisma.roomAvailability.update({
          where: { id: record.id },
          data: { availableRooms: record.availableRooms - roomsBooked }
        });
      } else {
        // Create new record with reduced availability
        await prisma.roomAvailability.create({
          data: {
            roomTypeId,
            date,
            availableRooms: roomType.totalRooms - roomsBooked
          }
        });
      }
    }
  } catch (error) {
    console.error("Error updating room availability:", error);
    throw error;
  }
}

/**
 * Helper function to get all dates in a range
 */
function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  
  // Create copies of dates to avoid modifying the original objects
  // Add one day to the start date to fix the off-by-one issue
  const currentDate = new Date(startDate);
  currentDate.setDate(currentDate.getDate() + 1);
  currentDate.setHours(0, 0, 0, 0);
  
  // Create end date with time set to beginning of the day
  // Add one day to the end date to fix the off-by-one issue
  const end = new Date(endDate);
  end.setDate(end.getDate() + 1);
  end.setHours(0, 0, 0, 0);
  
  // For a hotel stay from checkIn to checkOut, we need all nights BETWEEN those dates
  // If someone checks in on the 21st and checks out on the 26th, they stay the nights of 21, 22, 23, 24, 25
  while (currentDate < end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Calculate number of rooms booked for a specific date
 * @param roomTypeId - Room type ID
 * @param date - The date to check
 * @returns Number of rooms booked for that date
 */
export async function getBookedRoomsForDate(roomTypeId: string, date: Date): Promise<number> {
  const formattedDate = new Date(date);
  formattedDate.setHours(0, 0, 0, 0);
  
  const reservations = await prisma.reservation.findMany({
    where: {
      roomTypeId,
      status: "CONFIRMED",
      checkInDate: { lte: formattedDate },
      checkOutDate: { gte: formattedDate }
    }
  });
  
  return reservations.reduce((total, res) => total + res.roomsBooked, 0);
}

/**
 * Update room availability when a reservation is cancelled
 * @param reservationId - The ID of the cancelled reservation
 */
export async function releaseRoomAvailability(reservationId: string): Promise<void> {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId }
    });

    if (!reservation) {
      throw new Error("Reservation not found");
    }

    // Get all dates in the range using the helper function
    const dateRange = getDatesInRange(reservation.checkInDate, reservation.checkOutDate);

    // Get existing availability records for the date range
    const availabilityRecords = await prisma.roomAvailability.findMany({
      where: {
        roomTypeId: reservation.roomTypeId,
        date: {
          gte: reservation.checkInDate,
          lte: reservation.checkOutDate
        }
      }
    });

    // Get room type to know total rooms
    const roomType = await prisma.roomType.findUnique({
      where: { id: reservation.roomTypeId }
    });

    if (!roomType) {
      throw new Error("Room type not found");
    }

    // Create a map for quick lookup
    const availabilityMap = new Map();
    availabilityRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      availabilityMap.set(dateKey, {
        id: record.id,
        availableRooms: record.availableRooms
      });
    });

    // Process each date individually instead of batching to handle errors better
    for (const date of dateRange) {
      const dateKey = date.toISOString().split('T')[0];
      
      try {
        if (availabilityMap.has(dateKey)) {
          // Update existing record
          const record = availabilityMap.get(dateKey);
          await prisma.roomAvailability.update({
            where: { id: record.id },
            data: {
              availableRooms: Math.min(roomType.totalRooms, record.availableRooms + reservation.roomsBooked)
            }
          });
        } else {
          // For dates without records, use upsert instead of create to handle potential race conditions
          await prisma.roomAvailability.upsert({
            where: {
              roomTypeId_date: {
                roomTypeId: reservation.roomTypeId,
                date
              }
            },
            update: {
              // If it exists (rare race condition), increase availability
              availableRooms: {
                increment: reservation.roomsBooked
              }
            },
            create: {
              roomTypeId: reservation.roomTypeId,
              date,
              // Calculate accurate availability for new records
              availableRooms: roomType.totalRooms - await getAdjustedBookedRooms(reservation.roomTypeId, date, reservation.id)
            }
          });
        }
      } catch (error) {
        console.error(`Error updating availability for date ${dateKey}:`, error);
        // Continue with other dates even if one fails
      }
    }
  } catch (error) {
    console.error("Error releasing room availability:", error);
    throw error;
  }
}

/**
 * Calculate booked rooms for a date, excluding a specific reservation
 * @param roomTypeId - Room type ID
 * @param date - The date to check
 * @param excludeReservationId - ID of reservation to exclude from count
 */
async function getAdjustedBookedRooms(roomTypeId: string, date: Date, excludeReservationId: string): Promise<number> {
  const formattedDate = new Date(date);
  formattedDate.setHours(0, 0, 0, 0);
  
  const reservations = await prisma.reservation.findMany({
    where: {
      roomTypeId,
      status: "CONFIRMED",
      id: { not: excludeReservationId }, // Exclude the reservation being cancelled
      checkInDate: { lte: formattedDate },
      checkOutDate: { gte: formattedDate }
    }
  });
  
  return reservations.reduce((total, res) => total + res.roomsBooked, 0);
}
