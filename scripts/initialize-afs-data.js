const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
require('dotenv').config();

const prisma = new PrismaClient();

// Use environment variables for API key and base URL
const API_KEY = process.env.AFS_API_KEY;
const AFS_BASE_URL = process.env.AFS_BASE_URL || 'https://advanced-flights-system.replit.app';

// Ensure AFS_BASE_URL doesn't end with a slash for consistent URL joining
const BASE_URL = AFS_BASE_URL.endsWith('/') 
  ? AFS_BASE_URL.slice(0, -1) 
  : AFS_BASE_URL;

// API endpoints
const CITIES_ENDPOINT = `${BASE_URL}/api/cities`;
const AIRPORTS_ENDPOINT = `${BASE_URL}/api/airports`;

const apiConfig = {
  headers: {
    'x-api-key': API_KEY
  }
};

async function fetchCities() {
  try {
    console.log('Fetching cities from AFS...');
    const response = await axios.get(CITIES_ENDPOINT, apiConfig);
    return response.data;
  } catch (error) {
    console.error('Error fetching cities:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function fetchAirports() {
  try {
    console.log('Fetching airports from AFS...');
    const response = await axios.get(AIRPORTS_ENDPOINT, apiConfig);
    return response.data;
  } catch (error) {
    console.error('Error fetching airports:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function storeCities(cities) {
  console.log(`Storing ${cities.length} cities in the database...`);
  
  for (const city of cities) {
    await prisma.city.upsert({
      where: {
        name_country: {
          name: city.city,
          country: city.country
        }
      },
      update: {
        name: city.city,
        country: city.country,
        updatedAt: new Date()
      },
      create: {
        name: city.city,
        country: city.country
      }
    });
  }
  
  console.log('Cities stored successfully.');
}

async function storeAirports(airports) {
  console.log(`Storing ${airports.length} airports in the database...`);
  
  for (const airport of airports) {
    // Find the city this airport belongs to
    let city = await prisma.city.findFirst({
      where: {
        name: airport.city,
        country: airport.country
      }
    });
    
    if (!city) {
      // Create city if it doesn't exist
      city = await prisma.city.create({
        data: {
          name: airport.city,
          country: airport.country
        }
      });
      console.log(`Created missing city: ${city.name}, ${city.country}`);
    }
    
    await prisma.airport.upsert({
      where: {
        afsId: airport.id
      },
      update: {
        code: airport.code,
        name: airport.name,
        cityId: city.id,
        country: airport.country,
        updatedAt: new Date()
      },
      create: {
        code: airport.code,
        name: airport.name,
        cityId: city.id,
        country: airport.country,
        afsId: airport.id
      }
    });
  }
  
  console.log('Airports stored successfully.');
}

async function main() {
  try {
    console.log('Starting AFS data initialization...');
    
    // Fetch data from AFS
    const cities = await fetchCities();
    const airports = await fetchAirports();
    
    // Store data in the database
    await storeCities(cities);
    await storeAirports(airports);
    
    console.log('AFS data initialization completed successfully.');
  } catch (error) {
    console.error('Error during AFS data initialization:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
main();
