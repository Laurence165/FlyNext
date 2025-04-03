import { prisma } from "@/utils/db";

export async function getHotelSuggestions(city: string,checkInDate: string, checkOutDate: string) {
  try {
    // const hotels = await prisma.hotel.findMany({
    //   where: { city: city },
    //   select: {
    //     id: true,
    //     name: true,
    //     logo: true,
    //     address: true,
    //     city: true,
    //   },
    // });
    const hotelURL = `${process.env.NEXT_PUBLIC_API_URL}/api/hotels?city=${encodeURIComponent(city)}&checkIn=${checkInDate}&checkOut=${checkOutDate}`;
      
    console.log("Fetching hotels from:", hotelURL);

    const hotelResponse = await fetch(hotelURL, { method: "GET" });

    if (!hotelResponse.ok) {
      throw new Error(`Failed to fetch flights: ${hotelResponse.statusText}`);
    }

    const hotels = await hotelResponse.json();

    return hotels.map((hotel) => ({
      ...hotel,
      link: `${process.env.NEXT_PUBLIC_API_URL}/api/hotels?name=${encodeURIComponent(hotel.name)}&city=${encodeURIComponent(city)}&checkIn=${checkInDate}&checkOut=${checkOutDate}`,
    }));
  } catch (error) {
    console.error("Error fetching hotel suggestions:", error);
    return [];
  }
}

