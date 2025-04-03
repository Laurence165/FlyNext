const axios = require('axios');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + "/api" || "http://localhost:3000/api";

async function testCreateHotel() {
  try {
    const testHotelData = {
      name: "new hotel",
      address: "125 Main Street",
      city: "Paris",
      latitude: 40.7128,
      longitude: -74.0060,
      starRating: 4,
      logo: "https://example.com/hotel-logo.jpg",
      images: [
        "https://example.com/hotel-image1.jpg",
        "https://example.com/hotel-image2.jpg",
        "https://example.com/hotel-image3.jpg"
      ]
    };

    console.log('Creating test hotel with data:', testHotelData);
    const response = await axios.post(`${API_BASE_URL}/hotels`, testHotelData);
    console.log('Success! Created hotel:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating hotel:', error.response?.data || error.message);
    throw error;
  }
}

// Run the test
testCreateHotel()
  .then(() => console.log('Test completed'))
  .catch(() => console.log('Test failed')); 