'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'  // Use useRouter from next/navigation
import { Button } from '@/components/ui/button'
import { hotelAPI } from '@/app/services/api'

type Hotel = {
  id: string
  name: string
  address: string
  city: string
  starRating: number
  images: string[]
}

const EditHotelPage = () => {
  //const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')  // Get `id` from query parameters
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch hotel data only after `id` is available
  useEffect(() => {
    if (!id) return // If `id` is not available, we can't fetch data

    const fetchHotelData = async () => {
      try {
        console.log('Fetching hotel data for id:', id)
        const data = await hotelAPI.getHotelById(id as string)  // Ensure `id` is a string
        console.log('Fetched hotel data:', data)
        setHotel(data)  // Set the fetched hotel data
      } catch (error) {
        console.error('Error fetching hotel data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHotelData()
  }, [id])  // Trigger the effect when `id` changes

  if (isLoading) {
    return <div>Loading hotel data...</div>  // Show loading until data is fetched
  }

  if (!hotel) {
    return <div>Hotel not found!</div>  // If hotel is not found, show error
  }

  return (
    <div>
      <h1>Edit Hotel</h1>
      <div>
        <label>Name</label>
        <input
          type="text"
          value={hotel.name}
          onChange={(e) => setHotel({ ...hotel, name: e.target.value })}
        />
      </div>
      <div>
        <label>Address</label>
        <input
          type="text"
          value={hotel.address}
          onChange={(e) => setHotel({ ...hotel, address: e.target.value })}
        />
      </div>
      <div>
        <label>City</label>
        <input
          type="text"
          value={hotel.city}
          onChange={(e) => setHotel({ ...hotel, city: e.target.value })}
        />
      </div>
      <div>
        <label>Star Rating</label>
        <input
          type="number"
          value={hotel.starRating}
          onChange={(e) => setHotel({ ...hotel, starRating: +e.target.value })}
        />
      </div>
      <Button onClick={() => { /* Save logic here */ }}>Save Changes</Button>
    </div>
  )
}

export default EditHotelPage
