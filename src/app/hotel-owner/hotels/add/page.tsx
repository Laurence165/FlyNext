"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Star, Upload, X } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/app/components/auth/auth-context";
import { Hotel } from "@/types";
import { createHotelAPI } from "@/app/services/api";
import { profileAPI } from "@/app/services/api";
export default function AddHotel() {
  const { user, isHotelOwner, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    starRating: 0,
    logo: "",
    images: [] as string[],
  });

  useEffect(() => {
    // Only run on client-side
    if (typeof window !== "undefined" && !isLoading) {
      if (!isHotelOwner) {
        router.push("/login");
      }
    }
  }, [isHotelOwner, router, isLoading]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Create FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "hotelLogo");
        // Upload the image
        const response = await profileAPI.uploadProfileImage(formData);

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const data = await response.json();

        // Update preview and form data with the new image URL
        setPreviewImage(data.url);
        console.log("Uploaded Image URL:", data.url);

        setFormData((prev) => ({ ...prev, logo: data.url }));
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
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
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isHotelOwner) {
      toast({
        title: "Permission denied",
        description: "Only hotel owners can add hotels",
        variant: "destructive",
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one image of your hotel",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const hotelData = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        starRating: Number(formData.starRating),
        logo: formData.logo,
        images: images,
      };

      console.log("Submitting hotel data:", hotelData);

      await createHotelAPI.createHotel(hotelData);

      toast({
        title: "Hotel added",
        description: "Your hotel has been added successfully",
      });

      router.push("/hotel-owner/hotels");
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error adding your hotel",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
    );
  }

  if (!user || !isHotelOwner) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        Unauthorized access
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Add New Hotel
        </h1>

        <form onSubmit={handleSubmit}>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Provide the basic details about your hotel
              </CardDescription>
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

              {/* <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your hotel, its amenities, and what makes it special"
                  rows={4}
                  required
                />
              </div> */}

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
                      variant={
                        formData.starRating >= rating ? "default" : "outline"
                      }
                      size="sm"
                      className="w-10 h-10 p-0"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, starRating: rating }))
                      }
                    >
                      <Star
                        className={
                          formData.starRating >= rating ? "fill-white" : ""
                        }
                      />
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
                    <Image
                      src={previewImage || "/placeholder.svg"}
                      alt="Hotel Logo"
                      fill
                      className="object-cover"
                    />
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
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
              <CardDescription>
                Upload images of your hotel (minimum 1 image)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-md overflow-hidden border"
                    >
                      <Image
                        src={image || "/placeholder.svg"}
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
                    <label
                      htmlFor="hotel-images"
                      className="text-sm font-medium text-primary cursor-pointer"
                    >
                      Upload Images
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG or WEBP
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <CardFooter className="flex justify-end space-x-4 px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/hotel-owner/hotels")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Hotel...
                </>
              ) : (
                "Add Hotel"
              )}
            </Button>
          </CardFooter>
        </form>
      </div>
    </div>
  );
}
