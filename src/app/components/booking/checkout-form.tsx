"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlertCircle, CreditCard, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useBooking } from "./booking-context"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const formSchema = z.object({
  cardholderName: z.string().min(3, "Cardholder name is required"),
  cardNumber: z.string().min(16, "Card number must be at least 16 digits"),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Expiry date must be in MM/YY format"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits")
})

export default function CheckoutForm() {
  const { toast } = useToast()
  const router = useRouter()
  const { cart, clearCart, fetchCart } = useBooking()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cardholderName: "",
      cardNumber: "",
      expiryDate: "",
      cvv: ""
    }
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsProcessing(true)
    setPaymentError(null) // Reset any previous errors
    
    try {
      // Get all booking IDs from cart
      const bookingIds = cart.map(item => item.id)
      
      // Process payment
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingIds,
          cardNumber: values.cardNumber.replace(/\s/g, ''),
          cardholderName: values.cardholderName,
          expiryDate: values.expiryDate,
          cvv: values.cvv
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        setPaymentError(data.error || 'Payment failed. Please check your payment details and try again.')
        throw new Error(data.error || 'Payment failed')
      }
      
      // Clear cart after successful payment
      clearCart();

      // Add a small delay before fetching cart to ensure backend has updated
      setTimeout(async () => {
        await fetchCart();
        
        // Redirect to bookings page after cart is refreshed
        router.push('/bookings');
      }, 500);

      toast({
        title: "Payment Successful",
        description: "Your booking has been confirmed. You will receive a confirmation email shortly.",
      })
    } catch (error) {
      console.error('Payment error:', error)
      // Error is already set in state above, no need to do anything else here
    } finally {
      setIsProcessing(false)
    }
  }

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return value
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Payment Details</h3>
        
        {paymentError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Error</AlertTitle>
            <AlertDescription>{paymentError}</AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="cardholderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Cardholder Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" className="bg-background text-foreground" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cardNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Card Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="4111 1111 1111 1111" 
                  className="bg-background text-foreground"
                  {...field} 
                  onChange={(e) => {
                    field.onChange(formatCardNumber(e.target.value))
                  }}
                  maxLength={19}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Expiry Date</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="MM/YY" 
                    className="bg-background text-foreground"
                    {...field} 
                    maxLength={5}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '')
                      if (value.length > 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4)
                      }
                      field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cvv"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">CVV</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="123" 
                    className="bg-background text-foreground"
                    {...field} 
                    maxLength={4}
                    onChange={(e) => {
                      field.onChange(e.target.value.replace(/\D/g, ''))
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isProcessing}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}

