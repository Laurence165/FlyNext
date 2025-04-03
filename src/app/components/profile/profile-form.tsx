"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Loader2, Upload } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth, type User } from "../auth/auth-context"
import { profileAPI } from "@/app/services/api" 
import { useRouter } from "next/navigation"
export default function ProfileForm() {
  const { user, updateProfile } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<User>>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    profilePic: user?.profilePic || "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(user?.profilePic || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && typeof window !== "undefined") {
      try {
        // Create FormData
        const formData = new FormData()
        formData.append("file", file)
        formData.append("type", "profile")
        // Upload the image
        const response = await profileAPI.uploadProfileImage(formData)

        if (!response.ok) {
          throw new Error("Failed to upload image")
        }

        const data = await response.json()
        
        // Update preview and form data with the new image URL
        setPreviewImage(data.url)
        console.log("Uploaded Image URL:", data.url);

        setFormData((prev) => ({ ...prev, profilePic: data.url }))
      } catch (error) {
        console.error("Error uploading image:", error)
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log(formData)
      await updateProfile(formData)
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
      router.push("/profile")
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "There was an error updating your profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) {
    return <div>Please log in to view your profile</div>
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-muted">
              {previewImage ? (
                <Image src={previewImage || "/placeholder.svg"} alt="Profile" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
            </div>
            <div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Change Photo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone || ""}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

