import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log("Starting database cleanup...");

  try {
    // Delete in order to respect foreign key constraints
    // Start with child tables that have foreign key dependencies

    // Delete notifications
    const deletedNotifications = await prisma.notification.deleteMany({});
    console.log(`Deleted ${deletedNotifications.count} notifications`);

    // Delete invoices
    const deletedInvoices = await prisma.invoice.deleteMany({});
    console.log(`Deleted ${deletedInvoices.count} invoices`);

    // Delete flights
    const deletedFlights = await prisma.flight.deleteMany({});
    console.log(`Deleted ${deletedFlights.count} flights`);

    // Delete reservations
    const deletedReservations = await prisma.reservation.deleteMany({});
    console.log(`Deleted ${deletedReservations.count} reservations`);

    // Delete bookings
    const deletedBookings = await prisma.booking.deleteMany({});
    console.log(`Deleted ${deletedBookings.count} bookings`);

    // Delete room availability records
    const deletedRoomAvailability = await prisma.roomAvailability.deleteMany(
      {}
    );
    console.log(
      `Deleted ${deletedRoomAvailability.count} room availability records`
    );

    // Delete room type images
    const deletedRoomTypeImages = await prisma.roomTypeImage.deleteMany({});
    console.log(`Deleted ${deletedRoomTypeImages.count} room type images`);

    // Delete amenities
    const deletedAmenities = await prisma.amenities.deleteMany({});
    console.log(`Deleted ${deletedAmenities.count} amenities`);

    // Delete room types
    const deletedRoomTypes = await prisma.roomType.deleteMany({});
    console.log(`Deleted ${deletedRoomTypes.count} room types`);

    // Delete hotel images
    const deletedHotelImages = await prisma.hotelImage.deleteMany({});
    console.log(`Deleted ${deletedHotelImages.count} hotel images`);

    // Delete hotels
    const deletedHotels = await prisma.hotel.deleteMany({});
    console.log(`Deleted ${deletedHotels.count} hotels`);

    // Delete airports
    const deletedAirports = await prisma.airport.deleteMany({});
    console.log(`Deleted ${deletedAirports.count} airports`);

    // Delete cities
    const deletedCities = await prisma.city.deleteMany({});
    console.log(`Deleted ${deletedCities.count} cities`);

    // Delete airlines
    const deletedAirlines = await prisma.airline.deleteMany({});
    console.log(`Deleted ${deletedAirlines.count} airlines`);

    // Delete users
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`Deleted ${deletedUsers.count} users`);

    console.log("Database cleared successfully!");
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
