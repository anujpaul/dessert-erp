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

// ── Data Management ───────────────────────────────────────────────────────────
export interface ImportJob {
  id: string;
  entityType: string;
  fileFormat: string;
  fileName: string;
  status: 'Queued' | 'Processing' | 'Completed' | 'Failed' | 'PartialSuccess';
  totalRows: number;
  successRows: number;
  failedRows: number;
  stagedRows: number;
  validRows: number;
  invalidRows: number;
  promotedRows: number;
  errorSummary?: string;
  triggeredBy?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}
// ── Batch Jobs ────────────────────────────────────────────────────────────────
export type BatchJobType =
  'ImportSalesOrder' | 'ImportPurchaseOrder' | 'ImportVendor' | 'ImportProduct' |
  'ExportSalesOrder' | 'ExportPurchaseOrder' | 'ExportVendor' | 'ExportProduct';

export type BatchJobRunStatus = 'Never' | 'Running' | 'Success' | 'PartialSuccess' | 'Failed' | 'NoFilesFound';

// ── Retail ─────────────────────────────────────────────────────────────────────
export interface RetailStore {
  id: string; storeCode: string; name: string;
  address?: string; phone?: string; managerName?: string;
  isActive: boolean; createdAt: string;
}

export interface POSTransactionLine {
  id: string; productVariantId?: string; sku: string; productName: string;
  unitOfMeasure: string; quantity: number; unitPrice: number;
  discountPct: number; discountAmount: number; taxRate: number;
  lineSubTotal: number; taxAmount: number; lineTotal: number; isReturn: boolean;
}

export interface POSPayment {
  id: string; paymentMethod: string; amount: number; reference?: string;
}

export interface POSTransactionSummary {
  id: string; transactionNumber: string; storeName: string; externalRef?: string;
  transactionDate: string; transactionType: string; status: string;
  channel: string; fulfillmentStatus: string;
  grandTotal: number; lineCount: number; couponCode?: string;
  customerName?: string; externalOrderRef?: string;
  arInvoiceId?: string; createdAt: string;
}

export interface POSTransaction extends POSTransactionSummary {
  storeId: string; cashierId?: string; cashierName?: string; currency: string;
  customerEmail?: string; customerPhone?: string;
  deliveryAddress?: string; channelNotes?: string;
  subTotal: number; discountTotal: number; taxTotal: number;
  tenderedAmount: number; changeAmount: number; couponDiscount: number;
  journalEntryId?: string; processingError?: string; sourceFile?: string;
  lines: POSTransactionLine[]; payments: POSPayment[];
}

export interface Promotion {
  id: string; name: string; description?: string; discountType: string;
  status: string; discountValue: number; buyQuantity?: number; getQuantity?: number;
  minimumOrderAmount: number; maxUsesTotal: number; maxUsesPerCustomer: number;
  usedCount: number; startDate: string; endDate?: string;
  applyToAllProducts: boolean; applicableSkus?: string; createdAt: string;
}

export interface Coupon {
  id: string; promotionId: string; promotionName: string;
  code: string; isActive: boolean; maxUses: number; usedCount: number;
  remainingUses: number; expiresAt?: string; createdAt: string;
}

export interface CouponValidationResult {
  isValid: boolean; message?: string; promotionName?: string;
  discountType?: string; discountValue: number; discountAmount: number;
  expiresAt?: string; remainingUses: number;
}

export interface RetailSummary {
  totalTransactions: number; processedTransactions: number; failedTransactions: number;
  totalRevenue: number; totalDiscounts: number; totalTax: number;
  totalItemsSold: number; topStore: string;
}

export interface BatchJobConfig {
  id: string;
  name: string;
  jobType: BatchJobType;
  isEnabled: boolean;
  cronExpression: string;
  localInboxPath: string;
  localProcessedPath: string;
  localErrorPath: string;
  localExportPath?: string;
  fileFormat: string;
  exportFileNamePattern?: string;
  autoConfirmSalesOrders: boolean;
  lastRunStatus: BatchJobRunStatus;
  lastRunAt?: string;
  lastRunMessage?: string;
  lastRunFilesProcessed: number;
  lastRunRowsPromoted: number;
  createdAt: string;
}

export interface ImportJobRow {
  id: string;
  rowNumber: number;
  status: 'Pending' | 'Valid' | 'Invalid' | 'Promoted' | 'Skipped';
  errorMessage?: string;
  promotedEntityId?: string;
  promotedAt?: string;
}
export interface RowResult {
  row: number;
  success: boolean;
  error?: string;
}

// ── Product Management ────────────────────────────────────────────────────────
export interface Category {
  id: string; code: string; name: string; description?: string;
  parentCategoryId?: string; parentCategoryName?: string;
  displayOrder: number; isActive: boolean;
  taxRate: number;       // default for all products in this category
  taxCode?: string;      // e.g. CLOTHING, FOOTWEAR, FOOD_EXEMPT
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
  unitOfMeasure: string; baseCost: number; currency: string;
  effectiveTaxRate: number;    // resolved: override if set, else category rate
  taxRateOverride?: number;    // null/undefined = inherited from category
  categoryTaxRate: number;     // the category's default rate
  categoryTaxCode?: string;    // e.g. CLOTHING, FOOTWEAR
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

// ── Marketing ─────────────────────────────────────────────────────────────────
export interface Campaign {
  id: string; name: string; description?: string;
  type: string; status: string; targetAudience: string;
  startDate: string; endDate?: string;
  budget: number; actualSpend: number;
  linkedPromotionId?: string; linkedPromotionName?: string;
  tags?: string; reachCount: number; conversionCount: number;
  createdAt: string;
}

export interface LoyaltyProgram {
  id: string; name: string; description?: string;
  pointsPerDollar: number; dollarPerPoint: number;
  redemptionThreshold: number;
  silverThreshold: number; goldThreshold: number; platinumThreshold: number;
  isActive: boolean; createdAt: string;
}

export interface CustomerLoyaltyAccount {
  id: string; customerId: string; customerName: string; customerEmail?: string;
  totalPoints: number; redeemedPoints: number; availablePoints: number;
  tier: string; lastActivityAt?: string; createdAt: string;
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
  isExported: boolean; exportedAt?: string;
}
export interface SalesOrder {
  id: string; orderNumber: string; customerId: string; customerName: string;
  orderDate: string; requestedShipDate?: string; actualShipDate?: string;
  description: string; customerRef: string; currency: string;
  status: SalesOrderStatus;
  subTotal: number; taxTotal: number; discountTotal: number; grandTotal: number;
  arInvoiceId?: string;
  createdAt: string;
  lines: SalesOrderLine[];
  isExported: boolean;
  exportedAt?: string;
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
export type POStatus = 'Draft' | 'Sent' | 'PartiallyReceived' | 'FullyReceived' | 'Closed' | 'Cancelled';
export type POInvoiceStatus = 'NotInvoiced' | 'PartiallyInvoiced' | 'FullyInvoiced';
export interface PurchaseOrderLine {
  id: string; productVariantId: string; productCode: string;
  description: string; unitOfMeasure: string;
  orderedQty: number; receivedQty: number; unitCost: number; taxRate: number;
  lineTotal: number; isFullyReceived: boolean; outstandingQty: number;
}
export interface PurchaseOrderSummary {
  id: string; poNumber: string; vendorId: string; vendorName: string;
  orderDate: string; expectedDate?: string;
  status: POStatus; invoiceStatus: POInvoiceStatus;
  grandTotal: number; invoicedAmount: number; lineCount: number; createdAt: string;
}
export interface PurchaseOrder {
  id: string; poNumber: string; vendorId: string; vendorName: string;
  orderDate: string; expectedDate?: string; description: string; currency: string;
  status: POStatus; invoiceStatus: POInvoiceStatus;
  subTotal: number; taxTotal: number; grandTotal: number;
  invoicedAmount: number; canReceive: boolean;
  createdAt: string; lines: PurchaseOrderLine[];
}
export interface ReceiptLine {
  id: string; purchaseOrderLineId: string; productCode: string; description: string; qty: number;
}
export interface Receipt {
  id: string; receiptNumber: string; receivedDate: string; notes?: string; createdAt: string;
  lines: ReceiptLine[];
}
export type APInvoiceType = 'Standard' | 'Prepayment';
export type ThreeWayMatchStatus = 'NotMatched' | 'Matched' | 'QtyException' | 'PriceException' | 'FullException' | 'Bypassed';
export interface APInvoice {
  id: string; invoiceNumber: string; vendorId: string; vendorName: string;
  purchaseOrderId?: string; poNumber?: string;
  invoiceDate: string; dueDate: string; description: string; vendorInvoiceRef: string;
  subTotal: number; taxAmount: number; totalAmount: number;
  paidAmount: number; prepaymentApplied: number; outstandingAmount: number;
  status: 'Draft' | 'Approved' | 'Scheduled' | 'Paid' | 'Overdue' | 'Voided';
  invoiceType: APInvoiceType;
  matchStatus: ThreeWayMatchStatus;
  matchNotes?: string;
  bypassReason?: string;
  linkedPrepaymentInvoiceId?: string;
  linkedPrepaymentNumber?: string;
  daysOutstanding: number; createdAt: string;
}
export interface ThreeWayMatchResult {
  invoiceId: string; matchStatus: ThreeWayMatchStatus;
  receivedValue: number; previouslyInvoiced: number;
  uninvoicedReceived: number; invoiceSubTotal: number;
  variancePct: number; tolerancePct: number;
  qtyException: boolean; priceException: boolean;
}
export interface APAgingReport {
  vendorNumber: string; vendorName: string;
  current: number; days1_30: number; days31_60: number; days61_90: number;
  over90: number; total: number;
}
