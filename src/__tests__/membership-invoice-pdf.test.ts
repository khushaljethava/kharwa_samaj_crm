import { generateMembershipInvoicePdf } from "@/lib/utils/membership-invoice-pdf";

describe("Membership Invoice PDF Generation", () => {
  it("should generate a PDF with proper structure", async () => {
    const mockData = {
      receiptNumber: "RCPT-123456",
      memberName: "કિશોર કુમાર પટેલ",
      amount: 500,
      paymentDate: "15/12/2024",
      paymentMethod: "cash",
      planName: "Annual Family Plan",
      additionalDetails: "Family - Annual"
    };

    const pdfBytes = await generateMembershipInvoicePdf(mockData);
    
    // Check that PDF bytes are generated
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(0);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
  });

  it("should handle missing optional fields gracefully", async () => {
    const mockData = {
      receiptNumber: "RCPT-789",
      memberName: "Test Member",
      amount: 1000,
      paymentDate: "01/01/2024"
    };

    const pdfBytes = await generateMembershipInvoicePdf(mockData);
    
    // Should still generate PDF even with minimal data
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(0);
  });

  it("should handle special characters in member names", async () => {
    const mockData = {
      receiptNumber: "RCPT-456",
      memberName: "રાજેશ મહેતા & કિરણ બેન",
      amount: 750,
      paymentDate: "25/06/2024",
      paymentMethod: "upi",
      planName: "Premium Plan"
    };

    const pdfBytes = await generateMembershipInvoicePdf(mockData);
    
    expect(pdfBytes).toBeDefined();
    expect(pdfBytes.length).toBeGreaterThan(0);
  });
});

