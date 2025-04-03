import fs from 'fs';
import path from 'path';

/**
 * Simple fallback function to generate a text file invoice when PDF generation fails
 */
export async function generateTextInvoice(booking: any, user: any) {
  // Create directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'public/invoices');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create the invoice file name
  const fileName = `invoice_${booking.id}_${Date.now()}.txt`;
  const filePath = path.join(uploadsDir, fileName);

  // Generate text content
  const content = [
    '=== FlyNext - Booking Invoice ===',
    '',
    `Invoice #: ${booking.id.substring(0, 8)}`,
    `Date: ${new Date().toLocaleDateString()}`,
    '',
    '== Customer Information ==',
    `Name: ${user.firstName} ${user.lastName}`,
    `Email: ${user.email}`,
    '',
  ];

  // Add flight details
  if (booking.flights && booking.flights.length > 0) {
    content.push('== Flight Details ==');
    booking.flights.forEach((flight: any, index: number) => {
      content.push(`${index + 1}. ${flight.source} to ${flight.destination}`);
      content.push(`   Departure: ${new Date(flight.departureTime).toLocaleString()}`);
      content.push(`   Arrival: ${new Date(flight.arrivalTime).toLocaleString()}`);
      content.push('');
    });
  }

  // Add hotel reservation details
  if (booking.reservations && booking.reservations.length > 0) {
    content.push('== Hotel Reservations ==');
    booking.reservations.forEach((res: any, index: number) => {
      content.push(`${index + 1}. ${res.roomType.hotel.name}`);
      content.push(`   Room Type: ${res.roomType.name}`);
      content.push(`   Check-in: ${new Date(res.checkInDate).toLocaleDateString()}`);
      content.push(`   Check-out: ${new Date(res.checkOutDate).toLocaleDateString()}`);
      content.push(`   Rooms: ${res.roomsBooked}`);
      content.push('');
    });
  }

  // Add payment information
  content.push(`== Total Amount: $${booking.totalPrice.toFixed(2)} ==`);
  content.push('');
  content.push('Payment Method: Credit Card (xxxx-xxxx-xxxx-xxxx)');
  content.push('Status: PAID');
  content.push('');
  content.push('Terms and Conditions: This is a demo invoice for educational purposes only.');
  content.push('No actual payment has been processed.');
  content.push('');
  content.push('Thank you for booking with FlyNext!');

  // Write to file
  fs.writeFileSync(filePath, content.join('\n'));

  // Return the public URL path to the invoice
  return `/invoices/${fileName}`;
}
