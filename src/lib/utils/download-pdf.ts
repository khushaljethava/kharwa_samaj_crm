/**
 * Utility function to download PDF files from API endpoints
 */
export async function downloadPaymentReceiptPdf(paymentId: string, filename?: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/membership/payments/${paymentId}/pdf`);
    
    if (!response.ok) {
      console.error('Failed to download PDF:', response.statusText);
      return false;
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `membership-fee-receipt-${paymentId}.pdf`;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return false;
  }
}

/**
 * Utility function to open PDF in new tab (for viewing)
 */
export async function viewPaymentReceiptPdf(paymentId: string): Promise<boolean> {
  try {
    const url = `/api/membership/payments/${paymentId}/invoice`;
    window.open(url, '_blank');
    return true;
  } catch (error) {
    console.error('Error opening PDF:', error);
    return false;
  }
}

export async function downloadRentReceiptPdf(paymentId: string, filename?: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/rent/payments/${paymentId}/pdf`);
    
    if (!response.ok) {
      console.error('Failed to download PDF:', response.statusText);
      return false;
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `rent-receipt-${paymentId}.pdf`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return false;
  }
}

