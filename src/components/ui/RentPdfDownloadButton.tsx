"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";
import { downloadRentReceiptPdf } from "@/lib/utils/download-pdf";

interface RentPdfDownloadButtonProps {
  paymentId: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}

export function RentPdfDownloadButton({ 
  paymentId, 
  size = "sm", 
  variant = "outline",
  className = ""
}: RentPdfDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const filename = `rent-receipt-${paymentId}.pdf`;
      const success = await downloadRentReceiptPdf(paymentId, filename);
      if (!success) {
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
