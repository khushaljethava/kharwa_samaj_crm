import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { SalesBillPDFData } from "@/lib/types/sales";
import fs from 'fs';
import path from 'path';

export async function generateSalesBillPdf(data: SalesBillPDFData): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    
    // Use fonts that have better Unicode support
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const { width, height } = page.getSize();
    
    // Colors
    const black = rgb(0, 0, 0);
    const lightGray = rgb(0.9, 0.9, 0.9);
    
    // Helper function to safely draw text with fallback for unsupported characters
    function drawText(text: string, x: number, y: number, options: { 
      size?: number; 
      font?: any; 
      color?: any; 
      align?: 'left' | 'center' | 'right';
      fallbackText?: string;
    } = {}) {
      const { size = 12, font: textFont = font, color = black, align = 'left', fallbackText } = options;
      let adjustedX = x;
      
      // Use fallback text if provided, otherwise use original text
      const displayText = fallbackText || text;
      
      try {
        if (align === 'center') {
          const textWidth = textFont.widthOfTextAtSize(displayText, size);
          adjustedX = x - textWidth / 2;
        } else if (align === 'right') {
          const textWidth = textFont.widthOfTextAtSize(displayText, size);
          adjustedX = x - textWidth;
        }
        
        page.drawText(displayText, { x: adjustedX, y, size, font: textFont, color });
      } catch (error) {
        // If there's an encoding error, try to use a safe fallback
        console.warn(`Text encoding error for: "${text}", using fallback: "${fallbackText || 'N/A'}"`);
        
        // Try to draw with a simplified version
        const safeText = fallbackText || 'N/A';
        if (align === 'center') {
          const textWidth = textFont.widthOfTextAtSize(safeText, size);
          adjustedX = x - textWidth / 2;
        } else if (align === 'right') {
          const textWidth = textFont.widthOfTextAtSize(safeText, size);
          adjustedX = x - textWidth;
        }
        
        page.drawText(safeText, { x: adjustedX, y, size, font: textFont, color });
      }
    }
  
  // Helper function to draw rectangle
  function drawRect(x: number, y: number, width: number, height: number, color = lightGray) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color,
    });
  }
  
  // Helper function to draw border
  function drawBorder(x: number, y: number, width: number, height: number, lineWidth = 1) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: black,
      borderWidth: lineWidth,
    });
  }

  let currentY = height - 50;
  
  // Header - Organization Name (with English fallback)
  drawText('શ્રી ખરવા સમાજ માંડવી', width / 2, currentY, { 
    size: 20, 
    font: boldFont, 
    align: 'center',
    fallbackText: 'Shri Kharva Samaj Mandvi'
  });
  currentY -= 25;
  
  // Address (with English fallback)
  drawText('શ્રી રામેશ્વર મંદિર સામે, શ્રી રામેશ્વર ચોક, માંડવી-કચ્છ, 370465', width / 2, currentY, { 
    size: 12, 
    align: 'center',
    fallbackText: 'Shri Rameshwar Mandir Samne, Shri Rameshwar Chowk, Mandvi-Kutch, 370465'
  });
  currentY -= 40;
  
  // Invoice Title
  drawText('SALES INVOICE', width / 2, currentY, { 
    size: 18, 
    font: boldFont, 
    align: 'center' 
  });
  currentY -= 40;
  
  // Invoice details
  const leftColumn = 50;
  const rightColumn = width - 200;
  
  drawText(`Invoice No: ${data.billNumber}`, leftColumn, currentY, { font: boldFont });
  drawText(`Date: ${data.billDate}`, rightColumn, currentY);
  currentY -= 25;
  
  if (data.customerName) {
    drawText(`Customer: ${data.customerName}`, leftColumn, currentY, { font: boldFont });
    if (data.customerPhone) {
      drawText(`Phone: ${data.customerPhone}`, rightColumn, currentY);
    }
    currentY -= 25;
  }
  
  drawText(`Payment Method: ${data.paymentMethod.toUpperCase()}`, leftColumn, currentY);
  currentY -= 40;
  
  // Items table header
  const tableX = 50;
  const tableWidth = width - 100;
  const rowHeight = 25;
  
  // Table header background
  drawRect(tableX, currentY - rowHeight, tableWidth, rowHeight);
  drawBorder(tableX, currentY - rowHeight, tableWidth, rowHeight);
  
  // Column widths
  const col1Width = tableWidth * 0.05; // Sr.
  const col2Width = tableWidth * 0.35; // Item Name
  const col3Width = tableWidth * 0.15; // Category
  const col4Width = tableWidth * 0.1;  // Price
  const col5Width = tableWidth * 0.1;  // Qty
  const col6Width = tableWidth * 0.25; // Total
  
  // Column headers
  drawText('Sr.', tableX + 5, currentY - 17, { font: boldFont, size: 10 });
  drawText('Item Name', tableX + col1Width + 5, currentY - 17, { font: boldFont, size: 10 });
  drawText('Category', tableX + col1Width + col2Width + 5, currentY - 17, { font: boldFont, size: 10 });
  drawText('Price', tableX + col1Width + col2Width + col3Width + 5, currentY - 17, { font: boldFont, size: 10 });
  drawText('Qty', tableX + col1Width + col2Width + col3Width + col4Width + 5, currentY - 17, { font: boldFont, size: 10 });
  drawText('Total', tableX + col1Width + col2Width + col3Width + col4Width + col5Width + 5, currentY - 17, { font: boldFont, size: 10 });
  
  // Vertical lines for header
  let lineX = tableX + col1Width;
  page.drawLine({ start: { x: lineX, y: currentY }, end: { x: lineX, y: currentY - rowHeight }, color: black, thickness: 1 });
  lineX += col2Width;
  page.drawLine({ start: { x: lineX, y: currentY }, end: { x: lineX, y: currentY - rowHeight }, color: black, thickness: 1 });
  lineX += col3Width;
  page.drawLine({ start: { x: lineX, y: currentY }, end: { x: lineX, y: currentY - rowHeight }, color: black, thickness: 1 });
  lineX += col4Width;
  page.drawLine({ start: { x: lineX, y: currentY }, end: { x: lineX, y: currentY - rowHeight }, color: black, thickness: 1 });
  lineX += col5Width;
  page.drawLine({ start: { x: lineX, y: currentY }, end: { x: lineX, y: currentY - rowHeight }, color: black, thickness: 1 });
  
  currentY -= rowHeight;
  
  // Items rows
  data.items.forEach((item, index) => {
    drawBorder(tableX, currentY - rowHeight, tableWidth, rowHeight);
    
    drawText((index + 1).toString(), tableX + 5, currentY - 17, { size: 10 });
    
    // Handle item names that might contain special characters
    const itemName = item.item_name || 'Unknown Item';
    drawText(itemName, tableX + col1Width + 5, currentY - 17, { 
      size: 10,
      fallbackText: itemName.length > 20 ? itemName.substring(0, 20) + '...' : itemName
    });
    
    // Handle category names that might contain special characters
    const category = item.category || '';
    drawText(category, tableX + col1Width + col2Width + 5, currentY - 17, { 
      size: 10,
      fallbackText: category || 'N/A'
    });
    
    drawText(`₹${item.price.toFixed(2)}`, tableX + col1Width + col2Width + col3Width + 5, currentY - 17, { size: 10 });
    drawText(item.quantity.toString(), tableX + col1Width + col2Width + col3Width + col4Width + 5, currentY - 17, { size: 10 });
    drawText(`₹${item.total.toFixed(2)}`, tableX + col1Width + col2Width + col3Width + col4Width + col5Width + 5, currentY - 17, { size: 10 });
    
    // Vertical lines
    let lineX = tableX + col1Width;
    page.drawLine({ start: { x: lineX, y: currentY }, end: { x: lineX, y: currentY - rowHeight }, color: black, thickness: 1 });
    lineX += col2Width;
    page.drawLine({ start: { x: lineX, y: currentY }, end: { x: lineX, y: currentY - rowHeight }, color: black, thickness: 1 });
    lineX += col3Width;
    page.drawLine({ start: { x: lineX, y: currentY }, end: { x: lineX, y: currentY - rowHeight }, color: black, thickness: 1 });
    lineX += col4Width;
    page.drawLine({ start: { x: lineX, y: currentY }, end: { x: lineX, y: currentY - rowHeight }, color: black, thickness: 1 });
    lineX += col5Width;
    page.drawLine({ start: { x: lineX, y: currentY }, end: { x: lineX, y: currentY - rowHeight }, color: black, thickness: 1 });
    
    currentY -= rowHeight;
  });
  
  currentY -= 20;
  
  // Summary section
  const summaryX = width - 250;
  const summaryWidth = 200;
  
  // Subtotal
  drawText('Subtotal:', summaryX, currentY, { font: boldFont });
  drawText(`₹${data.subtotal.toFixed(2)}`, summaryX + summaryWidth - 80, currentY, { align: 'right' });
  currentY -= 20;
  
  // Membership Fee (if any)
  if (data.membershipFee > 0) {
    drawText('Membership Fee:', summaryX, currentY, { font: boldFont });
    drawText(`₹${data.membershipFee.toFixed(2)}`, summaryX + summaryWidth - 80, currentY, { align: 'right' });
    currentY -= 20;
  }
  
  // Discount (if any)
  if (data.discountAmount > 0) {
    drawText('Discount:', summaryX, currentY, { font: boldFont });
    drawText(`-₹${data.discountAmount.toFixed(2)}`, summaryX + summaryWidth - 80, currentY, { align: 'right' });
    currentY -= 20;
  }
  
  // Tax (if any)
  if (data.taxAmount > 0) {
    drawText('Tax:', summaryX, currentY, { font: boldFont });
    drawText(`₹${data.taxAmount.toFixed(2)}`, summaryX + summaryWidth - 80, currentY, { align: 'right' });
    currentY -= 20;
  }
  
  // Total
  drawBorder(summaryX, currentY - 25, summaryWidth, 25);
  drawText('TOTAL:', summaryX + 10, currentY - 17, { font: boldFont, size: 14 });
  drawText(`₹${data.totalAmount.toFixed(2)}`, summaryX + summaryWidth - 90, currentY - 17, { font: boldFont, size: 14, align: 'right' });
  
  currentY -= 50;
  
  // Notes (if any)
  if (data.notes) {
    drawText('Notes:', leftColumn, currentY, { font: boldFont });
    currentY -= 20;
    drawText(data.notes, leftColumn, currentY, { 
      size: 10,
      fallbackText: data.notes.length > 50 ? data.notes.substring(0, 50) + '...' : data.notes
    });
    currentY -= 30;
  }
  
  // Footer
  currentY -= 30;
  drawText('Thank you for your business!', width / 2, currentY, { 
    size: 14, 
    font: boldFont, 
    align: 'center' 
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
  } catch (error) {
    console.error("Error generating sales invoice PDF:", error);
    throw error; // Re-throw to be caught by the caller
  }
}
