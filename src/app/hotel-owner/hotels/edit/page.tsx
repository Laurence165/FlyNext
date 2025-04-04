'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, MapPin, Star, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/app/components/auth/auth-context'
import { hotelAPI } from '@/app/services/api'
import { profileAPI } from "@/app/services/api"
import { AddRoomType } from "@/types"

export default function EditHotel() {
  const { user, isHotelOwner, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [hotel, setHotel] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [roomTypes, setRoomTypes] = useState<AddRoomType[]>([])
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    address: '',
    city: '',
    starRating: 0,
    images: [] as string[],
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const id = searchParams.get('id')  // Get `id` from the query params

  // Add this state for managing amenities input
  const [amenityInput, setAmenityInput] = useState<{ [key: number]: string }>({})

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
          starRating: data.starRating,
          images: data.images.map((img: any) => img.url),
        })
        setImages(data.images.map((img: any) => img.url))
        
        // Fetch room types separately
        const roomTypesData = await hotelAPI.getAllRoomTypes(id)
        setRoomTypes(roomTypesData || [])
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Create FormData
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "hotelLogo")
        // Upload the image
        const response = await profileAPI.uploadProfileImage(formData)

        if (!response.ok) {
          throw new Error("Failed to upload image")
        }

        const data = await response.json()
        
        // Update preview and form data with the new image URL
        setPreviewImage(data.url)
        console.log("Uploaded Image URL:", data.url);

        setFormData((prev) => ({ ...prev, logo: data.url }))
      } catch (error) {
        console.error("Error uploading image:", error)
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        })
      }
    }
  };
  
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
  
    try {
      const uploadedUrls: string[] = [];
  
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "hotelLogo"); // you can parameterize if needed
  
        const response = await profileAPI.uploadProfileImage(formData);
  
        if (!response.ok) {
          throw new Error("Failed to upload image");
        }
  
        const data = await response.json();
        uploadedUrls.push(data.url);
      }
  
      // Update the state with the newly uploaded URLs
      setImages((prev) => [...prev, ...uploadedUrls]);
  
    } catch (error) {
      console.error("Error uploading images:", error);
    }
  };
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRoomTypeChange = (index: number, field: keyof AddRoomType, value: string | number) => {
    setRoomTypes(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value,
      }
      return updated
    })
  }

  const saveRoomTypeChanges = async (index: number) => {
    if (!id) return
  
    const roomType = roomTypes[index]
    const normalizedRoomType = {
      ...roomType,
      amenities: roomType.amenities.map(a => typeof a === 'string' ? a : a.amenity),
      images: roomType.images.map(image => typeof image === 'object' ? image.imageUrl : image),  // Normalize image URLs
    }
    try {
      let response
  
      if (roomType.id) {
        // Edit existing room type
        response = await hotelAPI.editRoomTypesByID(id, roomType.id, normalizedRoomType)
      } else {
        // Create new room type
        response = await hotelAPI.addRoomTypes(id, normalizedRoomType)
      }
  
      setRoomTypes(prev => {
        const updated = [...prev]
        updated[index] = response
        return updated
      })
  
      toast({
        title: 'Success',
        description: `Room type ${roomType.id ? 'updated' : 'added'} successfully`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${roomType.id ? 'update' : 'add'} room type`,
        variant: 'destructive',
      })
    }
  }
  
  

  const addRoomType = () => {
    const newRoomType = {
      name: 'New Room Type',
      pricePerNight: 100,
      totalRooms: 1,
      amenities: [],
      images: [],
      id: null, // or undefined, since it's not saved yet
    }
  
    setRoomTypes(prev => [...prev, newRoomType])
  }
  

  const removeRoomType = async (index: number) => {
    if (!id) return
    const roomType = roomTypes[index]
  
    try {
      if (roomType.id) {
        const confirmed = window.confirm('Are you sure you want to delete this room type? This action cannot be undone.')
  
        if (!confirmed) return
  
        console.log("Deleting existing room type")
        await hotelAPI.deleteRoomTypesByID(id, roomType.id)
      }
  
      setRoomTypes(prev => prev.filter((_, i) => i !== index))
  
      toast({
        title: 'Success',
        description: 'Room type removed successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove room type',
        variant: 'destructive',
      })
    }
  }
  
  // Add this function to handle amenity changes
  const handleAmenityChange = (roomTypeIndex: number, value: string) => {
    setAmenityInput(prev => ({
      ...prev,
      [roomTypeIndex]: value
    }))
  }

  const addAmenity = (roomTypeIndex: number) => {
    const input = amenityInput[roomTypeIndex]?.trim()
    if (!input) return
  
    setRoomTypes(prev => {
      const updated = [...prev]
      const currentAmenities = updated[roomTypeIndex].amenities || []
  
      // Prevent adding the same amenity twice
      if (currentAmenities.some(amenity => amenity.amenity === input)) return updated
  
      updated[roomTypeIndex] = {
        ...updated[roomTypeIndex],
        amenities: [...currentAmenities, { amenity: input }], // Store as object with key `amenity`
      }
  
      return updated
    })
  
    // Clear the input field
    setAmenityInput(prev => ({
      ...prev,
      [roomTypeIndex]: '',
    }))
  
    toast({
      title: 'Amenity Added',
      description: `"${input}" has been added to Room Type ${roomTypeIndex + 1}`,
    })
  }
  
  


  // Add this function to remove an amenity
  const removeAmenity = (roomTypeIndex: number, amenityIndex: number) => {
    setRoomTypes(prev => {
      const updated = [...prev]
      updated[roomTypeIndex] = {
        ...updated[roomTypeIndex],
        amenities: updated[roomTypeIndex].amenities.filter((_, i) => i !== amenityIndex),
      }
      return updated
    })
  }
  

  const handleRoomTypeImageUpload = async (roomTypeIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
  
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "roomType")
  
      const response = await profileAPI.uploadProfileImage(formData)
      if (!response.ok) throw new Error("Failed to upload image")
  
      const data = await response.json()
  
      setRoomTypes(prev => {
        const updated = [...prev]
        updated[roomTypeIndex] = {
          ...updated[roomTypeIndex],
          images: [...updated[roomTypeIndex].images, data.url]
        }
        return updated
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      })
    }
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
        starRating: Number(formData.starRating),
        logo: formData.logo,
        images: images,
      }
      
      if (!id) {
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

          {roomTypes.map((roomType, index) => (
  <div key={index} className="p-4 border rounded-lg space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium">Room Type {index + 1}</h3>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => removeRoomType(index)}
      >
        Remove
      </Button>
    </div>

    {/* Room Info Inputs */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor={`room-name-${index}`}>Room Name</Label>
        <Input
          id={`room-name-${index}`}
          value={roomType.name}
          onChange={(e) => handleRoomTypeChange(index, 'name', e.target.value)}
          placeholder="e.g. Deluxe Suite"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`room-price-${index}`}>Price per Night</Label>
        <Input
          id={`room-price-${index}`}
          type="number"
          value={roomType.pricePerNight}
          onChange={(e) => handleRoomTypeChange(index, 'pricePerNight', Number(e.target.value))}
          placeholder="e.g. 200"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`room-capacity-${index}`}>Total Rooms</Label>
        <Input
          id={`room-capacity-${index}`}
          type="number"
          value={roomType.totalRooms}
          onChange={(e) => handleRoomTypeChange(index, 'totalRooms', Number(e.target.value))}
          placeholder="e.g. 5"
          required
        />
      </div>
    </div>

    {/* Amenities Section */}
    <div className="space-y-2">
      <Label>Amenities</Label>
      <div className="flex gap-2 flex-wrap">
        {roomType.amenities.map((amenity, amenityIndex) => (
          <Badge key={amenityIndex} variant="secondary" className="flex items-center gap-1">
            {amenity.amenity}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={() => removeAmenity(index, amenityIndex)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={amenityInput[index] || ''}
          onChange={(e) => handleAmenityChange(index, e.target.value)}
          placeholder="Add an amenity"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addAmenity(index)
            }
          }}
        />
        <Button type="button" onClick={() => addAmenity(index)}>
          Add
        </Button>
      </div>
    </div>

    {/* Images Section */}
    <div className="space-y-2">
      <Label>Room Images</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
      {roomType.images.map((image, imageIndex) => {
        console.log('Rendering image:', image)  // Log the image URL here
        return (
          <div key={imageIndex} className="relative aspect-square rounded-md overflow-hidden border">
            <Image
              src={image.imageUrl}
              alt={`Room Image ${imageIndex + 1}`}
              fill
              className="object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => {
                setRoomTypes(prev => {
                  const updated = [...prev]
                  updated[index] = {
                    ...updated[index],
                    images: updated[index].images.filter((_, i) => i !== imageIndex),
                  }
                  return updated
                })
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )
      })}

        <div className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center p-4 text-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleRoomTypeImageUpload(index, e)}
            id={`room-images-${index}`}
          />
          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
          <label htmlFor={`room-images-${index}`} className="text-sm font-medium text-primary cursor-pointer">
            Upload Image
          </label>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG or WEBP</p>
        </div>
      </div>
    </div>

    {/* Save Changes Button */}
    <div className="flex justify-end">
      <Button type ="button" onClick={() => saveRoomTypeChanges(index)}>Save Changes</Button>
    </div>

      
  </div>
))}


          <CardFooter className="flex justify-end space-x-4 px-0">
          <Button type="button" variant="outline" onClick={addRoomType}>
            + Add Room Type
          </Button>

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
