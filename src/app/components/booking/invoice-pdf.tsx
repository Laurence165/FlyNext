"use client"

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { format } from "date-fns"
import type { Booking } from "./booking-context"

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: "1 solid #EEEEEE",
    paddingBottom: 10,
  },
  logo: {
    width: 100,
    height: 30,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#666666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    backgroundColor: "#F5F5F5",
    padding: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    color: "#666666",
  },
  value: {
    fontSize: 12,
    marginBottom: 5,
  },
  total: {
    marginTop: 20,
    borderTop: "1 solid #EEEEEE",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 30,
    borderTop: "1 solid #EEEEEE",
    paddingTop: 10,
    fontSize: 10,
    color: "#666666",
    textAlign: "center",
  },
})

interface InvoicePDFProps {
  booking: Booking
}

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMMM d, yyyy")
  } catch (error) {
    return dateString
  }
}

const formatDateTime = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMMM d, yyyy h:mm a")
  } catch (error) {
    return dateString
  }
}

const formatCurrency = (amount: number) => {
  return amount.toFixed(2)
}

const calculateTotal = (booking: Booking) => {
  let total = 0;
  
  // Calculate hotel reservation prices
  if (booking.reservations && booking.reservations.length > 0) {
    booking.reservations.forEach(reservation => {
      const nights = Math.round(
        (new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      total += reservation.roomType.pricePerNight * reservation.roomsBooked * nights;
    });
  }
  
  // Add flight prices
  if (booking.flights && booking.flights.length > 0) {
    total += booking.totalPrice || 0;
  }
  
  return total;
}

const InvoicePDF = ({ booking }: InvoicePDFProps) => {
  // Guard against undefined booking data
  if (!booking) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Error: Booking data not available</Text>
        </Page>
      </Document>
    );
  }
  
  const totalAmount = calculateTotal(booking);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FlyNext</Text>
          <Text style={styles.subtitle}>Invoice #{booking.id}</Text>
          <Text style={styles.subtitle}>Date: {formatDate(booking.bookingDate || new Date().toString())}</Text>
          <Text style={styles.subtitle}>Status: {booking.status || "PENDING"}</Text>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Information</Text>
          <Text style={styles.value}>Booking ID: {booking.id}</Text>
          <Text style={styles.value}>User ID: {booking.userId}</Text>
          <Text style={styles.value}>Status: {booking.status || "PENDING"}</Text>
          <Text style={styles.value}>Created: {formatDateTime(booking.createdAt || new Date().toString())}</Text>
        </View>

        {/* Flight Information */}
        {booking.flights && booking.flights.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flight Details</Text>
            {booking.flights.map((flight, index) => (
              <View key={flight.id} style={{ marginBottom: 10 }}>
                <Text style={{ ...styles.value, fontWeight: 'bold' }}>Flight {index + 1}</Text>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>From</Text>
                    <Text style={styles.value}>{flight.source}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>To</Text>
                    <Text style={styles.value}>{flight.destination}</Text>
                  </View>
                </View>
                
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Departure</Text>
                    <Text style={styles.value}>{formatDateTime(flight.departureTime)}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Arrival</Text>
                    <Text style={styles.value}>{formatDateTime(flight.arrivalTime)}</Text>
                  </View>
                </View>
                
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Status</Text>
                    <Text style={styles.value}>{flight.status}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Price</Text>
                    <Text style={styles.value}>${flight.price ? formatCurrency(flight.price) : "N/A"}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Hotel Information */}
        {booking.reservations && booking.reservations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hotel Reservations</Text>
            {booking.reservations.map((reservation) => {
              const nights = Math.round(
                (new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / 
                (1000 * 60 * 60 * 24)
              );
              const totalPrice = reservation.roomType.pricePerNight * reservation.roomsBooked * nights;
              
              return (
                <View key={reservation.id} style={{ marginBottom: 10 }}>
                  <Text style={{ ...styles.value, fontWeight: 'bold' }}>{reservation.roomType.hotel.name}</Text>
                  <View style={styles.row}>
                    <View style={styles.column}>
                      <Text style={styles.label}>Room Type</Text>
                      <Text style={styles.value}>{reservation.roomType.name}</Text>
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.label}>Status</Text>
                      <Text style={styles.value}>{reservation.status}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.row}>
                    <View style={styles.column}>
                      <Text style={styles.label}>Check-in</Text>
                      <Text style={styles.value}>{formatDate(reservation.checkInDate)}</Text>
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.label}>Check-out</Text>
                      <Text style={styles.value}>{formatDate(reservation.checkOutDate)}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.row}>
                    <View style={styles.column}>
                      <Text style={styles.label}>Nights</Text>
                      <Text style={styles.value}>{nights}</Text>
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.label}>Rooms</Text>
                      <Text style={styles.value}>{reservation.roomsBooked}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.row}>
                    <View style={styles.column}>
                      <Text style={styles.label}>Price per Night</Text>
                      <Text style={styles.value}>${formatCurrency(reservation.roomType.pricePerNight)}</Text>
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.label}>Total Price</Text>
                      <Text style={styles.value}>${formatCurrency(totalPrice)}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Total */}
        <View style={styles.total}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>${formatCurrency(totalAmount)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for booking with FlyNext!</Text>
          <Text>For any questions, please contact support@flynext.com</Text>
        </View>
      </Page>
    </Document>
  )
}

export default InvoicePDF

