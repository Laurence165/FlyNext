"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "./auth/auth-context"

type UserAvatarProps = {
  className?: string
  onClick?: () => void
}

export default function UserAvatar({ className = "", onClick }: UserAvatarProps) {
  const { user } = useAuth()
  const [key, setKey] = useState(Date.now())

  // Force re-render when user profile picture changes
  useEffect(() => {
    if (user?.profilePic) {
      setKey(Date.now())
    }
  }, [user?.profilePic])

  if (!user) return null

  const getInitials = () => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
  }

  return (
    <Avatar className={className} onClick={onClick}>
      <AvatarImage 
        src={`${user.profilePic}?v=${key}`} 
        alt={`${user.firstName} ${user.lastName}`} 
      />
      <AvatarFallback>{getInitials()}</AvatarFallback>
    </Avatar>
  )
}