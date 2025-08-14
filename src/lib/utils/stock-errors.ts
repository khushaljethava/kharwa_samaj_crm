import toast from "react-hot-toast";

export interface StockError {
  item_id: string;
  available: number;
  requested: number;
}

export interface StockErrorResponse {
  message: string;
  details: StockError[];
}

/**
 * Formats and displays stock error toasts with detailed information
 */
export function handleStockErrors(errorResponse: StockErrorResponse, itemsMap?: Map<string, { name: string; sku?: string }>) {
  const { message, details } = errorResponse;
  
  if (!details || details.length === 0) {
    toast.error(message || "Stock validation failed");
    return;
  }

  // Show a main error toast
  toast.error(`❌ ${message}`, {
    duration: 6000,
    style: {
      background: '#ef4444',
      color: 'white',
      fontWeight: 'bold',
    },
  });

  // Show detailed error for each item
  details.forEach((detail, index) => {
    const itemName = itemsMap?.get(detail.item_id)?.name || 
                    itemsMap?.get(detail.item_id)?.sku || 
                    `Item ${detail.item_id.slice(0, 8)}...`;
    
    const errorMessage = `${itemName}: Requested ${detail.requested}, but only ${detail.available} available`;
    
    toast.error(errorMessage, {
      duration: 8000,
      icon: '⚠️',
      style: {
        background: '#dc2626',
        color: 'white',
        fontSize: '14px',
      },
      // Stagger the toasts slightly
      id: `stock-error-${detail.item_id}`,
    });
    
    // Add a slight delay between toasts for better UX
    setTimeout(() => {}, index * 100);
  });
}

/**
 * Shows a warning toast for low stock scenarios
 */
export function showLowStockWarning(itemName: string, available: number, requested: number) {
  const message = `⚠️ Low stock alert: ${itemName} has ${available} units available (requesting ${requested})`;
  
  toast.success(message, {
    duration: 5000,
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: 'white',
    },
  });
}

/**
 * Shows a success toast for successful stock operations
 */
export function showStockSuccess(message: string) {
  toast.success(`✅ ${message}`, {
    duration: 4000,
    style: {
      background: '#10b981',
      color: 'white',
    },
  });
}
