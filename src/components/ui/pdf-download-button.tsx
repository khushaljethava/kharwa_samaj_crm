"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { downloadPaymentReceiptPdf } from "@/lib/utils/download-pdf";
import { useState } from "react";

interface PdfDownloadButtonProps {
  paymentId: string;
  receiptNumber?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}

export function PdfDownloadButton({ 
  paymentId, 
  receiptNumber, 
  size = "sm", 
  variant = "outline",
  className = ""
}: PdfDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const filename = receiptNumber 
        ? `membership-fee-receipt-${receiptNumber}.pdf`
        : `membership-fee-receipt-${paymentId}.pdf`;
      
      const success = await downloadPaymentReceiptPdf(paymentId, filename);
      if (!success) {
        // Could add toast notification here if you have a toast system
        console.error("Failed to download PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button 
      size={size} 
      variant={variant} 
      onClick={handleDownload}
      disabled={isDownloading}
      className={className}
    >
      <Download className="h-3 w-3 mr-1" />
      {isDownloading ? "Downloading..." : "Receipt"}
    </Button>
  );
}

