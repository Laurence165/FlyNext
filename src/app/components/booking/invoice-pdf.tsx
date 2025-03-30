"use client"

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
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

const InvoicePDF = ({ booking }: InvoicePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>FlyNext</Text>
        <Text style={styles.subtitle}>Invoice #{booking.id}</Text>
        <Text style={styles.subtitle}>Date: {booking.bookingDate}</Text>
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <Text style={styles.value}>User ID: {booking.userId}</Text>
        <Text style={styles.value}>Payment Method: {booking.paymentMethod}</Text>
        {booking.cardLastFour && (
          <Text style={styles.value}>Card ending in: **** **** **** {booking.cardLastFour}</Text>
        )}
      </View>

      {/* Flight Information */}
      {booking.flight && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flight Details</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Airline</Text>
              <Text style={styles.value}>{booking.flight.airline}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Flight Number</Text>
              <Text style={styles.value}>{booking.flight.flightNumber}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Departure</Text>
              <Text style={styles.value}>
                {booking.flight.departureCode} - {booking.flight.departureTime}
              </Text>
              <Text style={styles.value}>{booking.flight.departureDate}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Arrival</Text>
              <Text style={styles.value}>
                {booking.flight.arrivalCode} - {booking.flight.arrivalTime}
              </Text>
            </View>
          </View>
          {booking.flight.tripType === "roundTrip" && booking.flight.returnFlightNumber && (
            <>
              <Text style={styles.label}>Return Flight</Text>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Flight Number</Text>
                  <Text style={styles.value}>{booking.flight.returnFlightNumber}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Airline</Text>
                  <Text style={styles.value}>{booking.flight.returnAirline}</Text>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Departure</Text>
                  <Text style={styles.value}>
                    {booking.flight.returnDepartureCode} - {booking.flight.returnDepartureTime}
                  </Text>
                  <Text style={styles.value}>{booking.flight.returnDate}</Text>
                </View>
                <View style={styles.column}>
                  <Text style={styles.label}>Arrival</Text>
                  <Text style={styles.value}>
                    {booking.flight.returnArrivalCode} - {booking.flight.returnArrivalTime}
                  </Text>
                </View>
              </View>
            </>
          )}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Passengers</Text>
              <Text style={styles.value}>{booking.flight.passengers}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Price</Text>
              <Text style={styles.value}>${booking.flight.price}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Hotel Information */}
      {booking.hotel && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hotel Details</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Hotel</Text>
              <Text style={styles.value}>{booking.hotel.hotelName}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Room Type</Text>
              <Text style={styles.value}>{booking.hotel.roomType}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Check-in</Text>
              <Text style={styles.value}>{booking.hotel.checkIn}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Check-out</Text>
              <Text style={styles.value}>{booking.hotel.checkOut}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Nights</Text>
              <Text style={styles.value}>{booking.hotel.nights}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Guests</Text>
              <Text style={styles.value}>{booking.hotel.guests}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Price per Night</Text>
              <Text style={styles.value}>${booking.hotel.pricePerNight}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Total Price</Text>
              <Text style={styles.value}>${booking.hotel.totalPrice}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Total */}
      <View style={styles.total}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>${booking.totalAmount}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for booking with FlyNext!</Text>
        <Text>For any questions, please contact support@flynext.com</Text>
      </View>
    </Page>
  </Document>
)

export default InvoicePDF

