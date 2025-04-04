"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { checkoutAPI } from "@/app/services/api"
import { useBooking } from "./booking-context"

const formSchema = z.object({
  cardholderName: z.string().min(2, "Cardholder name is required"),
  cardNumber: z.string().regex(/^\d{13,19}$/, "Invalid card number"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/, "Invalid expiry date (MM/YY or MM/YYYY)"),
  cvv: z.string().regex(/^\d{3,4}$/, "Invalid CVV")
})

export default function CheckoutForm() {
  const { toast } = useToast()
  const router = useRouter()
  const { cart, clearCart } = useBooking()
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
    try {
      setIsProcessing(true)
      console.log("Starting checkout process...");
      
      // Get the booking ID from the cart
      if (!cart || cart.length === 0) {
        console.log("Cart is empty:", cart);
        toast({
          title: "Error",
          description: "No items in cart",
          variant: "destructive",
        })
        return
      }
      
      console.log("Cart contents:", cart);
      
      // Assuming the booking ID is stored in the cart items
      const bookingId = cart[0].bookingId;
      console.log("Extracted bookingId:", bookingId);
      
      if (!bookingId) {
        toast({
          title: "Error",
          description: "Invalid booking information",
          variant: "destructive",
        })
        return
      }
      
      // Log the request payload
      const payload = {
        bookingId,
        ...values
      };
      console.log("Sending payload to API:", payload);
      
      // Make a direct fetch call to the API endpoint
      console.log("Fetching /api/checkout...");
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      console.log("API response status:", response.status);
      
      // Try to parse the response regardless of status code
      let responseData;
      try {
        responseData = await response.json();
        console.log("API response data:", responseData);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        responseData = null;
      }
      
      if (!response.ok) {
        throw new Error(responseData?.error || `Request failed with status ${response.status}`);
      }
      
      if (responseData?.success) {
        console.log("Payment successful, clearing cart and redirecting...");
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed. You can now view and print your invoice.",
        })
        clearCart()
        
        // Force a hard navigation to ensure the page refreshes
        window.location.href = "/bookings";
      } else {
        throw new Error("API returned success: false or undefined");
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false);
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
                <Input placeholder="4111 1111 1111 1111" {...field} />
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
                  <Input placeholder="MM/YY" {...field} />
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
                  <Input type="password" placeholder="123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Pay Now"}
        </Button>
      </form>
    </Form>
  )
}

