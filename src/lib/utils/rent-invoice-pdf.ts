import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface RentInvoiceData {
  receiptNumber: string;
  tenantName: string;
  amount: number;
  paymentDate: string;
  rentMonth: string;
  sourceName: string;
  paymentMethod?: string;
  receiverName?: string;
}

export async function generateRentInvoicePdf(data: RentInvoiceData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 420.94]); // A5 portrait
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  const black = rgb(0, 0, 0);

  let y = height - 40;

  page.drawText('SHREE MANDVI KHARVA SAMAJ', {
    x: 50,
    y,
    font: boldFont,
    size: 18,
  });

  y -= 30;
  page.drawText('Rent Receipt', {
    x: 50,
    y,
    font: boldFont,
    size: 16,
  });

  y -= 20;
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1 });

  y -= 20;
  page.drawText(`Receipt No: ${data.receiptNumber}`, { x: 50, y, font, size: 12 });
  page.drawText(`Date: ${data.paymentDate}`, { x: width - 150, y, font, size: 12 });

  y -= 30;
  page.drawText(`Received from: ${data.tenantName}`, { x: 50, y, font, size: 12 });

  y -= 20;
  page.drawText(`the sum of ₹${data.amount}/-`, { x: 50, y, font, size: 12 });

  y -= 20;
  page.drawText(`for the rent of ${data.sourceName} for the month of ${data.rentMonth}.`, { x: 50, y, font, size: 12 });

  y -= 30;
  page.drawText(`Payment Method: ${data.paymentMethod || 'Cash'}`, { x: 50, y, font, size: 12 });

  y -= 30;
  page.drawText(`Received by: ${data.receiverName || 'N/A'}`, { x: 50, y, font, size: 12 });

  y -= 50;
  page.drawText('_________________________', { x: width - 200, y, font, size: 12 });
  y -= 15;
  page.drawText('Authorized Signature', { x: width - 180, y, font, size: 12 });

  return pdfDoc.save();
}
