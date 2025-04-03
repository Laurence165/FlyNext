"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/app/components/auth/auth-context"
import LoginForm from "../components/auth/login-form"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const { login } = useAuth()

  const handleLoginSuccess = async (email: string, password: string) => {
    try {
      await login(email, password)
      
      // After successful login, check for returnTo parameter
      if (returnTo) {
        router.push(returnTo)
        // Check for pending flight search
        const pendingSearch = sessionStorage.getItem('pendingFlightSearch')
        if (pendingSearch) {
          // You could handle the pending search here, or let the flight search
          // page handle it when it loads
          sessionStorage.removeItem('pendingFlightSearch')
        }
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6">Login to Your Account</h1>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  )
}

