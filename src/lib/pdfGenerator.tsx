import { renderToFile } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import { generateTextInvoice } from './simpleInvoice';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 20,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  invoiceDetails: {
    marginBottom: 20,
    fontSize: 12,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  text: {
    fontSize: 12,
    marginBottom: 3,
  },
  item: {
    marginLeft: 10,
    marginBottom: 5,
  },
  total: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    textAlign: 'center',
  },
});

// Create Invoice PDF Document
const InvoiceDocument = ({ booking, user }: { booking: any; user: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>FlyNext - Booking Invoice</Text>
      
      <View style={styles.invoiceDetails}>
        <View style={styles.row}>
          <Text style={styles.label}>Invoice #:</Text>
          <Text>{booking.id.substring(0, 8)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text>{new Date().toLocaleDateString()}</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.title}>Customer</Text>
        <Text style={styles.text}>Name: {user.firstName} {user.lastName}</Text>
        <Text style={styles.text}>Email: {user.email}</Text>
      </View>
      
      {booking.flights && booking.flights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.title}>Flight Details</Text>
          {booking.flights.map((flight: any, index: number) => (
            <View key={`flight-${index}`} style={styles.item}>
              <Text style={styles.text}>• {flight.source} to {flight.destination}</Text>
              <Text style={styles.text}>  Departure: {new Date(flight.departureTime).toLocaleString()}</Text>
              <Text style={styles.text}>  Arrival: {new Date(flight.arrivalTime).toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}
      
      {booking.reservations && booking.reservations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.title}>Hotel Reservations</Text>
          {booking.reservations.map((reservation: any, index: number) => (
            <View key={`reservation-${index}`} style={styles.item}>
              <Text style={styles.text}>• {reservation.room.hotel.name}</Text>
              <Text style={styles.text}>  Room Type: {reservation.room.name}</Text>
              <Text style={styles.text}>  Check-in: {new Date(reservation.checkInDate).toLocaleDateString()}</Text>
              <Text style={styles.text}>  Check-out: {new Date(reservation.checkOutDate).toLocaleDateString()}</Text>
              <Text style={styles.text}>  Rooms: {reservation.roomsBooked}</Text>
            </View>
          ))}
        </View>
      )}
      
      <Text style={styles.total}>Total Amount: ${booking.totalPrice.toFixed(2)}</Text>
      
      <View style={styles.section}>
        <Text style={styles.title}>Payment Details</Text>
        <Text style={styles.text}>Payment Method: Credit Card (xxxx-xxxx-xxxx-xxxx)</Text>
        <Text style={styles.text}>Status: PAID</Text>
      </View>
      
      <View style={styles.footer}>
        <Text>Terms and Conditions: This is a demo invoice for educational purposes only.</Text>
        <Text>No actual payment has been processed.</Text>
        <Text style={{ marginTop: 10 }}>Thank you for booking with FlyNext!</Text>
      </View>
    </Page>
  </Document>
);

/**
 * Generate a PDF invoice for a booking
 */
export async function generateInvoicePDF(booking: any, user: any) {
  // Create directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public/invoices');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create the invoice file name
  const fileName = `invoice_${booking.id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadsDir, fileName);

  try {
    // Render PDF to file
    await renderToFile(
      <InvoiceDocument booking={booking} user={user} />,
      filePath
    );

    // Return the public URL path to the invoice
    return `/invoices/${fileName}`;
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fall back to a simpler method if PDF generation fails
    return generateTextInvoice(booking, user);
  }
}
