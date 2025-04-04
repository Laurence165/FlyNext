"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CreditCard, Loader2 } from "lucide-react"

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
    console.log("Checkout form submitted with values:", {
      cardholderName: values.cardholderName,
      cardNumberLength: values.cardNumber.replace(/\s/g, '').length,
      expiryDate: values.expiryDate,
      cvvLength: values.cvv.length
    });
    
    try {
      // Get all booking IDs from cart
      const bookingIds = cart.map(item => item.id)
      console.log("Booking IDs to process:", bookingIds);
      console.log("Cart items:", cart.length);
      
      // Process payment
      console.log("Sending checkout request...");
      const token = localStorage.getItem('token');
      console.log("Token exists:", !!token);
      
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
      
      console.log("Checkout response status:", response.status);
      const data = await response.json()
      console.log("Checkout response data:", data);
      
      if (!response.ok) {
        console.log("Checkout failed with error:", data.error);
        throw new Error(data.error || 'Payment failed')
      }
      
      // Clear cart after successful payment
      console.log("Payment successful, clearing cart");
      clearCart();

      // Add a small delay before fetching cart to ensure backend has updated
      setTimeout(async () => {
        await fetchCart();
        
        // Redirect to bookings page after cart is refreshed
        console.log("Redirecting to bookings page");
        router.push('/bookings');
      }, 500);

      toast({
        title: "Payment Successful",
        description: "Your booking has been confirmed. You will receive a confirmation email shortly.",
      })
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred during payment processing.",
        variant: "destructive"
      })
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="cardholderName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cardholder Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
              <FormLabel>Card Number</FormLabel>
              <FormControl>
                <Input 
                  placeholder="4111 1111 1111 1111" 
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
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="MM/YY" 
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
                <FormLabel>CVV</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="123" 
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

