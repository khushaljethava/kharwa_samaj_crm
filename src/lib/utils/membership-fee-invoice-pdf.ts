import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface MembershipFeeInvoiceData {
  receiptNumber: string;
  memberName: string;
  memberCode?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
}

export async function generateMembershipFeeInvoicePdf(data: MembershipFeeInvoiceData): Promise<Uint8Array> {
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
    const primaryColor = rgb(0.2, 0.4, 0.8);
    
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
    drawText('MEMBERSHIP FEE RECEIPT', width / 2, currentY, { 
      size: 18, 
      font: boldFont, 
      align: 'center',
      color: primaryColor
    });
    currentY -= 40;
    
    // Receipt details
    const leftColumn = 50;
    const rightColumn = width - 200;
    
    drawText(`Receipt No: ${data.receiptNumber}`, leftColumn, currentY, { font: boldFont });
    drawText(`Date: ${data.paymentDate}`, rightColumn, currentY);
    currentY -= 25;
    
    // Member Information
    drawText(`Member Name: ${data.memberName}`, leftColumn, currentY, { font: boldFont });
    if (data.memberCode) {
      drawText(`Member Code: ${data.memberCode}`, rightColumn, currentY);
    }
    currentY -= 25;
    
    drawText(`Payment Method: ${data.paymentMethod.toUpperCase()}`, leftColumn, currentY);
    currentY -= 40;
    
    // Payment Details Box
    const detailsBoxX = 50;
    const detailsBoxWidth = width - 100;
    const detailsBoxHeight = 80;
    
    // Box background
    drawRect(detailsBoxX, currentY - detailsBoxHeight, detailsBoxWidth, detailsBoxHeight, rgb(0.95, 0.97, 1));
    drawBorder(detailsBoxX, currentY - detailsBoxHeight, detailsBoxWidth, detailsBoxHeight);
    
    // Box title
    drawText('PAYMENT DETAILS', detailsBoxX + 20, currentY - 20, { font: boldFont, size: 14, color: primaryColor });
    
    // Amount
    drawText('Amount Paid:', detailsBoxX + 20, currentY - 45, { font: boldFont });
    drawText(`₹${data.amount.toFixed(2)}`, detailsBoxX + detailsBoxWidth - 80, currentY - 45, { font: boldFont, size: 16, color: primaryColor });
    
    // Status
    drawText('Status:', detailsBoxX + 20, currentY - 70, { font: boldFont });
    drawText('PAID', detailsBoxX + detailsBoxWidth - 80, currentY - 70, { font: boldFont, color: rgb(0, 0.6, 0) });
    
    currentY -= (detailsBoxHeight + 30);
    
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
    
    // Terms and Conditions
    currentY -= 20;
    drawText('Terms & Conditions:', leftColumn, currentY, { font: boldFont, size: 12 });
    currentY -= 20;
    
    const terms = [
      '1. This receipt confirms payment of membership fee',
      '2. Member status has been activated',
      '3. Keep this receipt for your records',
      '4. Valid for the current membership period'
    ];
    
    terms.forEach(term => {
      drawText(term, leftColumn + 10, currentY, { size: 10 });
      currentY -= 15;
    });
    
    // Footer
    currentY -= 40;
    drawText('Thank you for your membership!', width / 2, currentY, { 
      size: 14, 
      font: boldFont, 
      align: 'center',
      color: primaryColor
    });
    
    currentY -= 20;
    drawText('For any queries, please contact the administration', width / 2, currentY, { 
      size: 10, 
      align: 'center',
      color: rgb(0.5, 0.5, 0.5)
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (error) {
    console.error("Error generating membership fee invoice PDF:", error);
    throw error; // Re-throw to be caught by the caller
  }
}
