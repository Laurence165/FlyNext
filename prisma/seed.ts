import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create hotel owner users
  const hotelOwner1 = await prisma.user.create({
    data: {
      firstName: "John",
      lastName: "Smith",
      email: "john@hotels.com",
      password: await hash("password123", 10),
      phone: "555-123-4567",
      profilePic: "upload/users/john.jpg",
      role: Role.HOTEL_OWNER,
    },
  });

  const hotelOwner2 = await prisma.user.create({
    data: {
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah@hotels.com",
      password: await hash("password123", 10),
      phone: "555-987-6543",
      profilePic: "upload/users/sarah.jpg",
      role: Role.HOTEL_OWNER,
    },
  });

  // Cities data
  const cities = [
    { name: "New York", country: "USA" },
    { name: "London", country: "UK" },
    { name: "Paris", country: "France" },
    { name: "Tokyo", country: "Japan" },
    { name: "Sydney", country: "Australia" },
    { name: "Dubai", country: "UAE" },
    { name: "Rome", country: "Italy" },
    { name: "Barcelona", country: "Spain" },
    { name: "Bangkok", country: "Thailand" },
    { name: "Toronto", country: "Canada" },
  ];

  // Create each city and hotels within them
  for (const cityData of cities) {
    // Check if city already exists
    let city = await prisma.city.findFirst({
      where: {
        name: cityData.name,
        country: cityData.country,
      },
    });

    // If city doesn't exist, create it
    if (!city) {
      city = await prisma.city.create({
        data: {
          name: cityData.name,
          country: cityData.country,
        },
      });
    }

    // Create hotels in this city
    await createHotelsInCity(city.name, hotelOwner1.id, hotelOwner2.id);
  }

  console.log("Seed data created successfully");
}

async function createHotelsInCity(
  cityName: string,
  ownerId1: string,
  ownerId2: string
) {
  // Hotel 1 - Luxury hotel
  const hotel1 = await prisma.hotel.create({
    data: {
      name: `${cityName} Grand Hotel`,
      address: `123 Main Avenue, ${cityName}`,
      city: cityName,
      latitude: 40.0,
      longitude: -75.0,
      starRating: 5,
      logo: `https://ik.imagekit.io/4jhmjkcvp/hotel1.jpg`,
      ownerId: ownerId1,
      images: {
        create: [
          { url: `https://ik.imagekit.io/4jhmjkcvp/hotel1.jpg` },
          { url: `https://ik.imagekit.io/4jhmjkcvp/hotel1.jpg` },
          { url: `https://ik.imagekit.io/4jhmjkcvp/hotel1.jpg` },
        ],
      },
    },
  });

  // Room types for Hotel 1
  const suite = await prisma.roomType.create({
    data: {
      hotelId: hotel1.id,
      name: "Executive Suite",
      pricePerNight: 450.0,
      totalRooms: 10,
      amenities: {
        create: [
          { amenity: "King Size Bed" },
          { amenity: "Sea View" },
          { amenity: "Jacuzzi" },
          { amenity: "Mini Bar" },
          { amenity: "Room Service" },
        ],
      },
      images: {
        create: [
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room1.jpg`,
          },
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room2.jpg`,
          },
        ],
      },
    },
  });

  const deluxe = await prisma.roomType.create({
    data: {
      hotelId: hotel1.id,
      name: "Deluxe Double",
      pricePerNight: 300.0,
      totalRooms: 20,
      amenities: {
        create: [
          { amenity: "Queen Size Bed" },
          { amenity: "City View" },
          { amenity: "Work Desk" },
          { amenity: "Free WiFi" },
        ],
      },
      images: {
        create: [
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room3.jpg`,
          },
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room4.jpg`,
          },
        ],
      },
    },
  });

  const standard = await prisma.roomType.create({
    data: {
      hotelId: hotel1.id,
      name: "Standard Room",
      pricePerNight: 200.0,
      totalRooms: 30,
      amenities: {
        create: [
          { amenity: "Double Bed" },
          { amenity: "TV" },
          { amenity: "Air Conditioning" },
        ],
      },
      images: {
        create: [
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room5.jpg`,
          },
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room1.jpg`,
          },
        ],
      },
    },
  });

  // Create availability for each room type (for next 30 days)
  await createRoomAvailability(suite.id, suite.totalRooms);
  await createRoomAvailability(deluxe.id, deluxe.totalRooms);
  await createRoomAvailability(standard.id, standard.totalRooms);

  // Hotel 2 - Boutique hotel
  const hotel2 = await prisma.hotel.create({
    data: {
      name: `${cityName} Boutique Inn`,
      address: `456 Park Street, ${cityName}`,
      city: cityName,
      latitude: 40.5,
      longitude: -75.5,
      starRating: 4,
      logo: `https://ik.imagekit.io/4jhmjkcvp/hotel2.jpg`,
      ownerId: ownerId2,
      images: {
        create: [
          { url: `https://ik.imagekit.io/4jhmjkcvp/hotel2.jpg` },
          { url: `https://ik.imagekit.io/4jhmjkcvp/hotel2.jpg` },
        ],
      },
    },
  });

  // Room types for Hotel 2
  const boutiqueDeluxe = await prisma.roomType.create({
    data: {
      hotelId: hotel2.id,
      name: "Designer Room",
      pricePerNight: 250.0,
      totalRooms: 15,
      amenities: {
        create: [
          { amenity: "Designer Furniture" },
          { amenity: "Balcony" },
          { amenity: "Espresso Machine" },
          { amenity: "Smart TV" },
        ],
      },
      images: {
        create: [
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room2.jpg`,
          },
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room1.jpg`,
          },
        ],
      },
    },
  });

  const boutiqueStandard = await prisma.roomType.create({
    data: {
      hotelId: hotel2.id,
      name: "Cozy Room",
      pricePerNight: 180.0,
      totalRooms: 25,
      amenities: {
        create: [
          { amenity: "Queen Size Bed" },
          { amenity: "Rain Shower" },
          { amenity: "Organic Toiletries" },
        ],
      },
      images: {
        create: [
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room3.jpg`,
          },
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room4.jpg`,
          },
        ],
      },
    },
  });

  // Create availability for each room type (for next 30 days)
  await createRoomAvailability(boutiqueDeluxe.id, boutiqueDeluxe.totalRooms);
  await createRoomAvailability(
    boutiqueStandard.id,
    boutiqueStandard.totalRooms
  );

  // Hotel 3 - Budget hotel
  const hotel3 = await prisma.hotel.create({
    data: {
      name: `${cityName} Budget Stay`,
      address: `789 Economy Road, ${cityName}`,
      city: cityName,
      latitude: 41.0,
      longitude: -76.0,
      starRating: 3,
      logo: `https://ik.imagekit.io/4jhmjkcvp/hotel3.jpg`,
      ownerId: ownerId1,
      images: {
        create: [
          { url: `https://ik.imagekit.io/4jhmjkcvp/hotel3.jpg` },
          { url: `https://ik.imagekit.io/4jhmjkcvp/hotel3.jpg` },
        ],
      },
    },
  });

  // Room types for Hotel 3
  const familyRoom = await prisma.roomType.create({
    data: {
      hotelId: hotel3.id,
      name: "Family Room",
      pricePerNight: 140.0,
      totalRooms: 15,
      amenities: {
        create: [
          { amenity: "Two Double Beds" },
          { amenity: "Refrigerator" },
          { amenity: "Free Breakfast" },
        ],
      },
      images: {
        create: [
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room1.jpg`,
          },
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room2.jpg`,
          },
        ],
      },
    },
  });

  const economy = await prisma.roomType.create({
    data: {
      hotelId: hotel3.id,
      name: "Economy Single",
      pricePerNight: 90.0,
      totalRooms: 30,
      amenities: {
        create: [
          { amenity: "Single Bed" },
          { amenity: "Basic Bathroom" },
          { amenity: "TV" },
        ],
      },
      images: {
        create: [
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room3.jpg`,
          },
          {
            imageUrl: `https://ik.imagekit.io/4jhmjkcvp/room4.jpg`,
          },
        ],
      },
    },
  });

  // Create availability for each room type (for next 30 days)
  await createRoomAvailability(familyRoom.id, familyRoom.totalRooms);
  await createRoomAvailability(economy.id, economy.totalRooms);
}

// Helper function to create room availability for the next 30 days
async function createRoomAvailability(roomTypeId: string, totalRooms: number) {
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);

    await prisma.roomAvailability.create({
      data: {
        roomTypeId,
        date,
        availableRooms: totalRooms, // Full availability, no random reduction
      },
    });
  }
}

// Helper function to generate random coordinates (no longer used but kept for reference)
function generateRandomCoordinate(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
