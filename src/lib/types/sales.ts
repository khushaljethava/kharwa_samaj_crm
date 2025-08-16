export interface SalesItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface BillItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  total: number;
  category?: string;
}

export interface SalesBill {
  id: string;
  bill_number: string;
  customer_name?: string;
  customer_phone?: string;
  items: BillItem[];
  subtotal: number;
  membership_fee: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'other' | 'membership';
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateSalesItemRequest {
  name: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

export interface UpdateSalesItemRequest extends Partial<CreateSalesItemRequest> {
  id: string;
}

export interface CreateSalesBillRequest {
  customer_name?: string;
  customer_phone?: string;
  items: BillItem[];
  subtotal: number;
  membership_fee?: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'other' | 'membership';
  notes?: string;
}

export interface SalesBillFilters {
  customer_name?: string;
  bill_number?: string;
  payment_method?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface SalesItemFilters {
  name?: string;
  category?: string;
  is_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface SalesBillPDFData {
  billNumber: string;
  customerName?: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  membershipFee: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  billDate: string;
  notes?: string;
}
