import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const airports = await prisma.airport.findMany({
      include: {
        city: true
      }
    })
    return NextResponse.json(airports)
  } catch (error) {
    console.error('Error fetching airports:', error)
    return NextResponse.json({ error: 'Failed to fetch airports' }, { status: 500 })
  }
}