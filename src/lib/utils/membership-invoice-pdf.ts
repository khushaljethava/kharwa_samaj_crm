import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface MembershipInvoiceData {
  receiptNumber: string;
  memberName: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  planName?: string;
  additionalDetails?: string;
}

export async function generateMembershipInvoicePdf(data: MembershipInvoiceData): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
    const { width, height } = page.getSize();
    const black = rgb(0, 0, 0);
  
    // Helper function to safely draw text
    function drawText(text: string, x: number, y: number, options: { 
      size?: number; 
      font?: any; 
      color?: any; 
      align?: 'left' | 'center' | 'right';
    } = {}) {
      const { size = 12, font: textFont = font, color = black, align = 'left' } = options;
      let adjustedX = x;
      
      try {
        if (align === 'center') {
          const textWidth = textFont.widthOfTextAtSize(text, size);
          adjustedX = x - textWidth / 2;
        } else if (align === 'right') {
          const textWidth = textFont.widthOfTextAtSize(text, size);
          adjustedX = x - textWidth;
        }
        
        page.drawText(text, { x: adjustedX, y, size, font: textFont, color });
      } catch (error) {
        // Fallback for unsupported characters
        const fallbackText = text.replace(/[^\x00-\x7F]/g, '?');
        if (align === 'center') {
          const textWidth = textFont.widthOfTextAtSize(fallbackText, size);
          adjustedX = x - textWidth / 2;
        } else if (align === 'right') {
          const textWidth = textFont.widthOfTextAtSize(fallbackText, size);
          adjustedX = x - textWidth;
        }
        page.drawText(fallbackText, { x: adjustedX, y, size, font: textFont, color });
      }
    }
  
    // Helper function to draw rectangle border
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
  
    // Convert amount to words in Gujarati
    function numberToGujaratiWords(amount: number): string {
      const ones = ['', 'એક', 'બે', 'ત્રણ', 'ચાર', 'પાંચ', 'છ', 'સાત', 'આઠ', 'નવ'];
      const tens = ['', '', 'વીસ', 'ત્રીસ', 'ચાલીસ', 'પચાસ', 'સાઠ', 'સિત્તેર', 'એંસી', 'નેવું'];
      const hundreds = ['', 'એકસો', 'બેસો', 'ત્રણસો', 'ચારસો', 'પાંચસો', 'છસો', 'સાતસો', 'આઠસો', 'નવસો'];
      
      if (amount === 0) return 'શૂન્ય રૂપિયા';
      if (amount < 10) return ones[amount] + ' રૂપિયા';
      if (amount < 100) {
        const ten = Math.floor(amount / 10);
        const one = amount % 10;
        return tens[ten] + (one > 0 ? ' ' + ones[one] : '') + ' રૂપિયા';
      }
      if (amount < 1000) {
        const hundred = Math.floor(amount / 100);
        const remainder = amount % 100;
        let result = hundreds[hundred];
        if (remainder > 0) {
          if (remainder < 10) {
            result += ' ' + ones[remainder];
          } else {
            const ten = Math.floor(remainder / 10);
            const one = remainder % 10;
            result += ' ' + tens[ten] + (one > 0 ? ' ' + ones[one] : '');
          }
        }
        return result + ' રૂપિયા';
      }
      return `${amount} રૂપિયા`; // Fallback for larger numbers
    }
  
    let currentY = height - 60;
  
    // Header - Organization Name

    // Gujarati Header
    drawText('શ્રી ખરવા સમાજ માંડવી', width / 2, currentY, {
      size: 18,
      font: boldFont,
      align: 'center'
    });
    currentY -= 25;

    // Gujarati Address
    drawText('શ્રી રામેશ્વર મંદિર સામે, શ્રી રામેશ્વર ચોક, માંડવી-કચ્છ, ૩૭૦૪૬૫', width / 2, currentY, {
      size: 12,
      align: 'center'
    });
    currentY -= 40;

    // Main table structure
    const tableX = 50;
    const tableWidth = width - 100;
    const rowHeight = 30;

    // Row 1: Receipt number, title, date
    const row1Y = currentY;
    drawBorder(tableX, row1Y - rowHeight, tableWidth, rowHeight);

    // Divide row 1 into 3 columns
    const col1Width = tableWidth * 0.25;
    const col2Width = tableWidth * 0.5;
    const col3Width = tableWidth * 0.25;

    // Vertical dividers for row 1
    page.drawLine({
      start: { x: tableX + col1Width, y: row1Y },
      end: { x: tableX + col1Width, y: row1Y - rowHeight },
      color: black,
      thickness: 1,
    });
    page.drawLine({
      start: { x: tableX + col1Width + col2Width, y: row1Y },
      end: { x: tableX + col1Width + col2Width, y: row1Y - rowHeight },
      color: black,
      thickness: 1,
    });

    drawText(`નંબર: ${data.receiptNumber}`, tableX + 10, row1Y - 20, {
      size: 12,
      font: boldFont
    });
    drawText('સભ્ય ફી રસીદ', tableX + col1Width + 10, row1Y - 20, {
      size: 12
    });
    drawText(`તારીખ: ${data.paymentDate}`, tableX + col1Width + col2Width + 10, row1Y - 20, {
      size: 12
    });

    currentY = row1Y - rowHeight;

    // Row 2: Member name
    const row2Y = currentY;
    drawBorder(tableX, row2Y - rowHeight, tableWidth, rowHeight);
    drawText(`સભ્યનું નામ: ${data.memberName}`, tableX + 10, row2Y - 20, {
      size: 12
    });
    currentY = row2Y - rowHeight;

    // Row 3: Confirmation text
    const row3Y = currentY;
    drawBorder(tableX, row3Y - rowHeight, tableWidth, rowHeight);
    drawText('તમારી માહિતી મુજબ રકમ પ્રાપ્ત થઈ.', tableX + 10, row3Y - 20, {
      size: 12
    });
    currentY = row3Y - rowHeight;

    // Row 4: Headers for details and amount
    const row4Y = currentY;
    drawBorder(tableX, row4Y - rowHeight, tableWidth, rowHeight);

    // Divide into 2 columns
    const detailsWidth = tableWidth * 0.7;
    const amountWidth = tableWidth * 0.3;

    page.drawLine({
      start: { x: tableX + detailsWidth, y: row4Y },
      end: { x: tableX + detailsWidth, y: row4Y - rowHeight },
      color: black,
      thickness: 1,
    });

    drawText('વિગતો', tableX + detailsWidth / 2, row4Y - 20, {
      size: 12,
      font: boldFont,
      align: 'center'
    });
    drawText('રકમ', tableX + detailsWidth + amountWidth / 2, row4Y - 20, {
      size: 12,
      font: boldFont,
      align: 'center'
    });
    currentY = row4Y - rowHeight;

    // Row 5: Payment details
    const row5Y = currentY;
    drawBorder(tableX, row5Y - rowHeight, tableWidth, rowHeight);

    page.drawLine({
      start: { x: tableX + detailsWidth, y: row5Y },
      end: { x: tableX + detailsWidth, y: row5Y - rowHeight },
      color: black,
      thickness: 1,
    });

    const paymentDetails = data.planName
      ? `સભ્ય ફી અને ${data.planName}`
      : `સભ્ય ફી અને ${data.additionalDetails || '__________'}`;

    drawText(paymentDetails, tableX + 10, row5Y - 20, {
      size: 12
    });
    drawText(`₹ ${data.amount.toFixed(2)}`, tableX + detailsWidth + 10, row5Y - 20, { size: 12 });
    currentY = row5Y - rowHeight;

    // Row 6: Total
    const row6Y = currentY;
    drawBorder(tableX, row6Y - rowHeight, tableWidth, rowHeight);

    page.drawLine({
      start: { x: tableX + detailsWidth, y: row6Y },
      end: { x: tableX + detailsWidth, y: row6Y - rowHeight },
      color: black,
      thickness: 1,
    });

    drawText('કુલ', tableX + detailsWidth - 80, row6Y - 20, {
      size: 12,
      font: boldFont
    });
    drawText(`₹ ${data.amount.toFixed(2)}`, tableX + detailsWidth + 10, row6Y - 20, {
      size: 12,
      font: boldFont
    });
    currentY = row6Y - rowHeight;

    // Row 7: Amount in words
    const row7Y = currentY;
    drawBorder(tableX, row7Y - rowHeight, tableWidth, rowHeight);
    const amountInWords = numberToGujaratiWords(data.amount);
    drawText(`અક્ષરે રકમ: ${amountInWords}`, tableX + 10, row7Y - 20, {
      size: 12
    });
    currentY = row7Y - rowHeight;

    // Row 8: Signature
    const row8Y = currentY;
    drawBorder(tableX, row8Y - rowHeight, tableWidth, rowHeight);
    drawText('સહી: ___________________________', tableX + tableWidth - 200, row8Y - 20, {
      size: 12
    });

    // Additional information at the bottom
    currentY -= 60;
    if (data.paymentMethod) {
      drawText(`ચુકવણી રીત: ${data.paymentMethod}`, tableX, currentY, { size: 10, color: black });
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;

  } catch (error) {
    console.error("Error generating membership invoice PDF:", error);
    throw error;
  }
}

