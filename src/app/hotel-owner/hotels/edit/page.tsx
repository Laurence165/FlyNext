'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, MapPin, Star, Upload, X } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/app/components/auth/auth-context'
import { hotelAPI } from '@/app/services/api'

export default function EditHotel() {
  const { user, isHotelOwner, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [hotel, setHotel] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    address: '',
    city: '',
    latitude: 0,
    longitude: 0,
    starRating: 0,
    images: [] as string[],
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const id = searchParams.get('id')  // Get `id` from the query params

  useEffect(() => {
    if (typeof window !== 'undefined' && !isLoading) {
      if (!isHotelOwner) {
        router.push('/login')
      }
    }
  }, [isHotelOwner, router, isLoading])

  // Fetch hotel data when `id` is available
  useEffect(() => {
    if (!id) return

    const fetchHotelData = async () => {
      try {
        const data = await hotelAPI.getHotelById(id)
        setHotel(data)
        setFormData({
          name: data.name,
          logo: data.logo,
          address: data.address,
          city: data.city,
          latitude: data.latitude,
          longitude: data.longitude,
          starRating: data.starRating,
          images: data.images,
        })
        setImages(data.images) // Set images for preview
      } catch (error) {
        console.error('Error fetching hotel data:', error)
      }
    }

    fetchHotelData()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && typeof window !== 'undefined') {
      const imageUrl = URL.createObjectURL(file)
      setFormData((prev) => ({ ...prev, logo: imageUrl }))
    }
  }

  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && typeof window !== 'undefined') {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
      setImages((prev) => [...prev, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isHotelOwner) {
      toast({
        title: 'Permission denied',
        description: 'Only hotel owners can edit hotels',
        variant: 'destructive',
      })
      return
    }

    if (images.length === 0) {
      toast({
        title: 'Images required',
        description: 'Please upload at least one image of your hotel',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const updatedHotelData = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        starRating: Number(formData.starRating),
        logo: formData.logo,
        images: images,
      }
      if (!id){
        throw Error()
      }
      await hotelAPI.updateHotelById(id, updatedHotelData)

      toast({
        title: 'Hotel updated',
        description: 'Your hotel has been updated successfully',
      })

      router.push('/hotel-owner/hotels')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'There was an error updating your hotel',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !hotel) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Edit Hotel</h1>

        <form onSubmit={handleSubmit}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide the basic details about your hotel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hotel Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Grand Hotel"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. 123 Main St"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. New York"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g. 40.7128"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g. -74.0060"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="starRating">Star Rating</Label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant={formData.starRating >= rating ? 'default' : 'outline'}
                      size="sm"
                      className="w-10 h-10 p-0"
                      onClick={() => setFormData((prev) => ({ ...prev, starRating: rating }))}
                    >
                      <Star className={formData.starRating >= rating ? 'fill-white' : ''} />
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Hotel Logo</CardTitle>
              <CardDescription>Upload your hotel's logo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-muted">
                  {formData.logo ? (
                    <Image src={formData.logo || '/placeholder.svg'} alt="Hotel Logo" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                      <MapPin className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                    ref={fileInputRef}
                  />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Hotel Images</CardTitle>
              <CardDescription>Upload images of your hotel (minimum 1 image)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                      <Image
                        src={image || '/placeholder.svg'}
                        alt={`Hotel Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center p-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImagesUpload}
                      id="hotel-images"
                    />
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <label htmlFor="hotel-images" className="text-sm font-medium text-primary cursor-pointer">
                      Upload Images
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WEBP</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <CardFooter className="flex justify-end space-x-4 px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/hotel-owner/hotels')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Hotel...
                </>
              ) : (
                'Update Hotel'
              )}
            </Button>
          </CardFooter>
        </form>
      </div>
    </div>
  )
}
