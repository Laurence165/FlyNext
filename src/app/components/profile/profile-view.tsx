"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Edit, LogOut, UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../auth/auth-context"
import { useToast } from "@/hooks/use-toast"

export default function ProfileView() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  console.log("user: "+ user)
  const handleLogout = () => {
    logout()
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
    router.push("/")
  }

  const handleEdit = () => {
    router.push("/profile/edit")
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Please log in to view your profile</p>
        <Button onClick={() => router.push("/login")}>Login</Button>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-col items-center">
        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-muted mb-4">
          {user.profilePic ? (
            <Image
              src={user.profilePic || "/placeholder.svg"}
              alt={`${user.firstName} ${user.lastName}`}
              width={128}
              height={128}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <UserIcon className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardTitle className="text-2xl">
          {user.firstName} {user.lastName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
            <p>{user.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
            <p>{user.phone || "Not provided"}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
        <Button variant="destructive" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </CardFooter>
    </Card>
  )
}

