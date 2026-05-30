// ── Organization ──────────────────────────────────────────────────────────────
export interface Organization {
  id: string;
  code: string;
  name: string;
  baseCurrency: string;
  fiscalYearStartMonth: number;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  logoUrl?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt: string;
}

// ── Product Management ────────────────────────────────────────────────────────
export interface Category {
  id: string; code: string; name: string; description?: string;
  parentCategoryId?: string; parentCategoryName?: string;
  displayOrder: number; isActive: boolean;
}
export interface Brand {
  id: string; code: string; name: string; description?: string;
  country?: string; website?: string; logoUrl?: string; isActive: boolean;
}
export interface ProductVariantDto {
  id: string; productId: string; sku: string; barcode?: string;
  size: string; color?: string; material?: string;
  additionalAttributes?: string;
  priceOverride?: number; costOverride?: number; weight?: number;
  status: 'Active' | 'Inactive' | 'Discontinued';
  effectivePrice: number; effectiveCost: number;
  quantityOnHand: number; quantityAvailable: number;
}
export interface ProductSummary {
  id: string; sku: string; name: string; categoryId?: string; categoryName?: string;
  brandId?: string; brandName?: string;
  productType: string; genderTarget: string; status: string;
  basePrice: number; variantCount: number;
}
export interface ProductDetail extends ProductSummary {
  description?: string; longDescription?: string;
  unitOfMeasure: string; baseCost: number; taxRate: number; currency: string;
  tags?: string; imageUrl?: string;
  preferredVendorId?: string; preferredVendorName?: string;
  variants: ProductVariantDto[];
}
export interface InventoryDto {
  id: string; productVariantId: string; variantSku: string;
  productName: string; categoryName?: string;
  quantityOnHand: number; quantityReserved: number; quantityAvailable: number;
  reorderPoint: number; minimumStock: number; maximumStock: number;
  location?: string; lastCountDate?: string; needsReorder: boolean;
}
export interface VariantLookup {
  variantId: string; sku: string; barcode?: string;
  productName: string; size: string; color?: string; material?: string;
  effectivePrice: number; effectiveCost: number;
  taxRate: number; unitOfMeasure: string;
  quantityAvailable: number;
  preferredVendorId?: string; preferredVendorName?: string;
}

// ── General Ledger ────────────────────────────────────────────────────────────
export interface FiscalYear {
  id: string; name: string; description: string;
  startDate: string; endDate: string; calendarType: string;
  status: 'Open' | 'Closed' | 'OnHold'; periodCount: number; createdAt: string;
}
export interface FiscalPeriod {
  id: string; fiscalYearId: string; periodNumber: number;
  name: string; startDate: string; endDate: string;
  status: 'Open' | 'Closed' | 'OnHold';
}
export interface AccountType { id: string; code: string; name: string; nature: 'Debit' | 'Credit'; displayOrder: number; }
export interface Account {
  id: string; accountNumber: string; name: string; description?: string;
  accountTypeId: string; accountTypeName: string;
  parentAccountId?: string; parentAccountName?: string;
  isHeaderAccount: boolean; allowManualEntry: boolean;
  status: 'Active' | 'Inactive' | 'Suspended'; currency: string; level: number;
}
export interface JournalLine {
  id: string; accountId: string; accountNumber: string; accountName: string;
  description: string; debit: number; credit: number; lineOrder: number;
}
export interface JournalEntry {
  id: string; entryNumber: string; entryDate: string;
  fiscalPeriodId: string; fiscalPeriodName: string;
  description: string; reference: string; journalType: string;
  status: 'Draft' | 'Posted' | 'Voided';
  currency: string; totalDebit: number; totalCredit: number;
  createdAt: string; lines: JournalLine[];
}
export interface TrialBalanceLine {
  accountNumber: string; accountName: string; accountType: string;
  totalDebit: number; totalCredit: number; balance: number;
}

// ── Accounts Receivable ───────────────────────────────────────────────────────
export interface Customer {
  id: string; customerNumber: string; name: string;
  email?: string; phone?: string; address?: string;
  currency: string; paymentTermsDays: number; creditLimit: number;
  status: 'Active' | 'Inactive' | 'OnHold' | 'Blacklisted'; createdAt: string;
}
export type SalesOrderStatus = 'Draft' | 'Confirmed' | 'Picking' | 'Shipped' | 'Invoiced' | 'Closed' | 'Cancelled';
export interface SalesOrderLine {
  id: string; productVariantId: string; sku: string;
  productName: string; variantDescription?: string;
  unitOfMeasure: string; quantity: number; unitPrice: number;
  discountPct: number; taxRate: number;
  lineSubTotal: number; discountAmount: number; taxAmount: number; lineTotal: number;
}
export interface SalesOrderSummary {
  id: string; orderNumber: string; customerId: string; customerName: string;
  orderDate: string; requestedShipDate?: string; customerRef: string;
  status: SalesOrderStatus; grandTotal: number; lineCount: number; createdAt: string;
}
export interface SalesOrder {
  id: string; orderNumber: string; customerId: string; customerName: string;
  orderDate: string; requestedShipDate?: string; actualShipDate?: string;
  description: string; customerRef: string; currency: string;
  status: SalesOrderStatus;
  subTotal: number; taxTotal: number; discountTotal: number; grandTotal: number;
  arInvoiceId?: string; createdAt: string; lines: SalesOrderLine[];
}
export interface ARInvoice {
  id: string; invoiceNumber: string; customerId: string; customerName: string;
  salesOrderId?: string; salesOrderNumber?: string;
  invoiceDate: string; dueDate: string; description: string;
  subTotal: number; taxAmount: number; discountAmount: number;
  totalAmount: number; paidAmount: number; outstandingAmount: number;
  status: 'Draft' | 'Issued' | 'PartiallyPaid' | 'FullyPaid' | 'Overdue' | 'Voided';
  daysOutstanding: number; createdAt: string;
}
export interface ARAgingReport {
  customerNumber: string; customerName: string;
  current: number; days1_30: number; days31_60: number; days61_90: number;
  over90: number; total: number;
}

// ── Accounts Payable ──────────────────────────────────────────────────────────
export interface Vendor {
  id: string; vendorNumber: string; name: string;
  email?: string; phone?: string; address?: string;
  currency: string; paymentTermsDays: number; taxId?: string;
  bankAccountName?: string; bankAccountNumber?: string;
  status: string; createdAt: string;
}
export type POStatus = 'Draft' | 'Sent' | 'PartiallyReceived' | 'FullyReceived' | 'Invoiced' | 'Closed' | 'Cancelled';
export interface PurchaseOrderLine {
  id: string; productVariantId: string; productCode: string;
  description: string; unitOfMeasure: string;
  orderedQty: number; receivedQty: number; unitCost: number; taxRate: number;
  lineTotal: number; isFullyReceived: boolean;
}
export interface PurchaseOrderSummary {
  id: string; poNumber: string; vendorId: string; vendorName: string;
  orderDate: string; expectedDate?: string;
  status: POStatus; grandTotal: number; lineCount: number; createdAt: string;
}
export interface PurchaseOrder {
  id: string; poNumber: string; vendorId: string; vendorName: string;
  orderDate: string; expectedDate?: string; description: string; currency: string;
  status: POStatus; subTotal: number; taxTotal: number; grandTotal: number;
  apInvoiceId?: string; createdAt: string; lines: PurchaseOrderLine[];
}
export interface APInvoice {
  id: string; invoiceNumber: string; vendorId: string; vendorName: string;
  purchaseOrderId?: string; poNumber?: string;
  invoiceDate: string; dueDate: string; description: string; vendorInvoiceRef: string;
  subTotal: number; taxAmount: number; totalAmount: number;
  paidAmount: number; outstandingAmount: number;
  status: 'Draft' | 'Approved' | 'Scheduled' | 'Paid' | 'Overdue' | 'Voided';
  daysOutstanding: number; createdAt: string;
}
export interface APAgingReport {
  vendorNumber: string; vendorName: string;
  current: number; days1_30: number; days31_60: number; days61_90: number;
  over90: number; total: number;
}
