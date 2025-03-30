"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Calendar, User, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useBooking } from "./booking-context"
import { Checkbox } from "@/components/ui/checkbox"

export default function CheckoutForm() {
  const { createBooking, cart } = useBooking()
  const { toast } = useToast()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    cardHolder: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    saveCard: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Format card number with spaces
    if (name === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
      setFormData((prev) => ({ ...prev, [name]: formatted }))
      return
    }

    // Format expiry date with slash
    if (name === "expiryDate") {
      const cleaned = value.replace(/\D/g, "")
      let formatted = cleaned
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`
      }
      setFormData((prev) => ({ ...prev, [name]: formatted }))
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, saveCard: checked }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate card holder
    if (!formData.cardHolder.trim()) {
      newErrors.cardHolder = "Card holder name is required"
    }

    // Validate card number (basic validation)
    const cardNumber = formData.cardNumber.replace(/\s/g, "")
    if (!cardNumber) {
      newErrors.cardNumber = "Card number is required"
    } else if (!/^\d{16}$/.test(cardNumber)) {
      newErrors.cardNumber = "Card number must be 16 digits"
    }

    // Validate expiry date
    const expiryDate = formData.expiryDate
    if (!expiryDate) {
      newErrors.expiryDate = "Expiry date is required"
    } else if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      newErrors.expiryDate = "Expiry date must be in MM/YY format"
    } else {
      // Check if card is expired
      const [month, year] = expiryDate.split("/").map(Number)
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear() % 100
      const currentMonth = currentDate.getMonth() + 1

      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiryDate = "Card is expired"
      }
    }

    // Validate CVV
    if (!formData.cvv) {
      newErrors.cvv = "CVV is required"
    } else if (!/^\d{3,4}$/.test(formData.cvv)) {
      newErrors.cvv = "CVV must be 3 or 4 digits"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const booking = await createBooking({
        cardNumber: formData.cardNumber.replace(/\s/g, ""),
        cardHolder: formData.cardHolder,
        expiryDate: formData.expiryDate,
        cvv: formData.cvv,
      })

      toast({
        title: "Booking confirmed!",
        description: `Your booking #${booking.id} has been confirmed.`,
      })

      // Redirect to booking confirmation page
      router.push(`/bookings/${booking.id}`)
    } catch (error) {
      toast({
        title: "Booking failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardHolder">Card Holder Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="cardHolder"
              name="cardHolder"
              placeholder="John Doe"
              className="pl-10"
              value={formData.cardHolder}
              onChange={handleChange}
            />
          </div>
          {errors.cardHolder && <p className="text-sm text-destructive">{errors.cardHolder}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cardNumber">Card Number</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="cardNumber"
              name="cardNumber"
              placeholder="4242 4242 4242 4242"
              className="pl-10"
              maxLength={19}
              value={formData.cardNumber}
              onChange={handleChange}
            />
          </div>
          {errors.cardNumber && <p className="text-sm text-destructive">{errors.cardNumber}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="expiryDate"
                name="expiryDate"
                placeholder="MM/YY"
                className="pl-10"
                maxLength={5}
                value={formData.expiryDate}
                onChange={handleChange}
              />
            </div>
            {errors.expiryDate && <p className="text-sm text-destructive">{errors.expiryDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvv">CVV</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="cvv"
                name="cvv"
                placeholder="123"
                className="pl-10"
                maxLength={4}
                value={formData.cvv}
                onChange={handleChange}
              />
            </div>
            {errors.cvv && <p className="text-sm text-destructive">{errors.cvv}</p>}
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox id="saveCard" checked={formData.saveCard} onCheckedChange={handleCheckboxChange} />
          <Label htmlFor="saveCard" className="text-sm font-normal">
            Save card for future bookings
          </Label>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : "Complete Booking"}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Your payment information is secure and encrypted
        </p>
      </div>
    </form>
  )
}

