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

// ── Inventory Management (extended) ───────────────────────────────────────────
export interface InventoryItem {
  id: string;
  productVariantId: string;
  sku: string;
  productName: string;
  variantDescription?: string;
  category?: string;
  brand?: string;
  unitOfMeasure: string;
  // Quantity buckets
  onHand: number;
  reserved: number;
  onOrder: number;
  available: number;
  projected: number;
  // Thresholds
  reorderPoint: number;
  minimumStock: number;
  maximumStock: number;
  // Costing
  averageCost: number;
  stockValue: number;
  // Metadata
  location?: string;
  lastCountDate?: string;
  lastReceivedDate?: string;
  needsReorder: boolean;
  isOutOfStock: boolean;
}

export interface InventorySummary {
  totalSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
  onOrderLines: number;
}

export interface InventoryTransaction {
  id: string;
  productVariantId: string;
  sku: string;
  transactionType: string;
  quantity: number;
  unitCost: number;
  balanceAfter: number;
  referenceNumber?: string;
  referenceDocumentId?: string;
  notes?: string;
  createdBy?: string;
  transactionDate: string;
}

export interface AdjustStockRequest {
  quantity: number;
  adjustmentType: string;
  unitCost: number;
  notes?: string;
  createdBy?: string;
}

export interface SetOnHandRequest {
  quantity: number;
  unitCost: number;
  notes?: string;
  createdBy?: string;
}

export interface UpdateThresholdsRequest {
  reorderPoint: number;
  minimumStock: number;
  maximumStock: number;
  location?: string;
}

export interface LowStockItem {
  productVariantId: string;
  sku: string;
  productName: string;
  variantDescription?: string;
  onHand: number;
  reorderPoint: number;
  onOrder: number;
  preferredVendorName?: string;
}

export interface StockValuation {
  category: string;
  skuCount: number;
  totalOnHand: number;
  totalValue: number;
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
// ── Customer Addresses & Contacts ─────────────────────────────────────────────
export type CustomerAddressType = 'Billing' | 'Shipping' | 'Other';
export interface CustomerAddress {
  id: string; label: string; addressType: CustomerAddressType; isPrimary: boolean;
  line1: string; line2?: string; city: string; state?: string;
  postalCode?: string; country: string; singleLine: string;
}
export interface CustomerContact {
  id: string; name: string; title?: string;
  email?: string; phone?: string; mobile?: string;
  isPrimary: boolean; notes?: string;
}
export interface SaveCustomerAddressRequest {
  label: string; addressType: CustomerAddressType;
  line1: string; line2?: string; city: string; state?: string;
  postalCode?: string; country?: string;
}
export interface SaveCustomerContactRequest {
  name: string; title?: string; email?: string;
  phone?: string; mobile?: string; notes?: string;
}

export interface Customer {
  id: string; customerNumber: string; name: string;
  email?: string; phone?: string;
  billingAddress?: string; shippingAddress?: string;
  website?: string; notes?: string;
  currency: string; paymentTermsDays: number; creditLimit: number;
  outstandingBalance: number; creditUsed: number; creditAvailable: number;
  status: 'Active' | 'Inactive' | 'OnHold' | 'Blacklisted'; createdAt: string;
  addresses?: CustomerAddress[];
  contacts?: CustomerContact[];
}
export interface CustomerLedgerEntry {
  entryType: string; reference: string; date: string;
  debit: number; credit: number; runningBalance: number;
  status: string; salesOrderNumber?: string;
}
export interface CustomerLedger {
  customerId: string; customerName: string; customerNumber: string;
  totalInvoiced: number; totalPaid: number; outstandingBalance: number;
  entries: CustomerLedgerEntry[];
}
export type SalesOrderStatus = 'Draft' | 'PendingApproval' | 'Confirmed' | 'Picking' | 'PartiallyShipped' | 'Shipped' | 'Delivered' | 'Invoiced' | 'Closed' | 'Cancelled';
export interface SalesOrderLine {
  id: string; productVariantId: string; sku: string;
  productName: string; variantDescription?: string;
  unitOfMeasure: string; quantity: number; quantityShipped: number; unitPrice: number;
  discountPct: number; taxRate: number;
  lineSubTotal: number; discountAmount: number; taxAmount: number; lineTotal: number;
}
export interface SalesOrderSummary {
  id: string; orderNumber: string; customerId: string; customerName: string;
  orderDate: string; requestedShipDate?: string; customerRef: string;
  status: SalesOrderStatus; grandTotal: number; lineCount: number; createdAt: string;
  isExported: boolean; exportedAt?: string;
  workflowInstanceId?: string; rejectionReason?: string;
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
  workflowInstanceId?: string; rejectionReason?: string;
  deliveredAt?: string; deliveryReference?: string;
}
export interface ARInvoice {
  id: string; invoiceNumber: string; customerId: string; customerName: string;
  salesOrderId?: string; salesOrderNumber?: string;
  invoiceDate: string; dueDate: string; description: string;
  subTotal: number; taxAmount: number; discountAmount: number;
  totalAmount: number; paidAmount: number; outstandingAmount: number;
  status: 'Draft' | 'Issued' | 'PartiallyPaid' | 'FullyPaid' | 'Overdue' | 'Voided';
  daysOutstanding: number; createdAt: string;
  workflowInstanceId?: string; isSubmittedForApproval?: boolean;
}
export interface ARAgingReport {
  customerNumber: string; customerName: string;
  current: number; days1_30: number; days31_60: number; days61_90: number;
  over90: number; total: number;
}

// ── Accounts Payable ──────────────────────────────────────────────────────────
// ── Vendor Addresses & Contacts ───────────────────────────────────────────────
export type VendorAddressType = 'Billing' | 'RemitTo' | 'Shipping' | 'Other';
export interface VendorAddress {
  id: string; label: string; addressType: VendorAddressType; isPrimary: boolean;
  line1: string; line2?: string; city: string; state?: string;
  postalCode?: string; country: string; singleLine: string;
}
export interface VendorContact {
  id: string; name: string; title?: string;
  email?: string; phone?: string; mobile?: string;
  isPrimary: boolean; notes?: string;
}
export interface SaveVendorAddressRequest {
  label: string; addressType: VendorAddressType;
  line1: string; line2?: string; city: string; state?: string;
  postalCode?: string; country?: string;
}
export interface SaveVendorContactRequest {
  name: string; title?: string; email?: string;
  phone?: string; mobile?: string; notes?: string;
}

export interface Vendor {
  id: string; vendorNumber: string; name: string;
  email?: string; phone?: string;
  billingAddress?: string; shippingAddress?: string;
  website?: string; notes?: string;
  currency: string; paymentTermsDays: number; taxId?: string;
  bankAccountName?: string; bankAccountNumber?: string; bankRoutingNumber?: string;
  outstandingPayable: number;
  status: string; createdAt: string;
  addresses?: VendorAddress[];
  contacts?: VendorContact[];
}
export interface VendorLedgerEntry {
  entryType: string; reference: string; date: string;
  debit: number; credit: number; runningBalance: number;
  status: string; poNumber?: string;
}
export interface VendorLedger {
  vendorId: string; vendorName: string; vendorNumber: string;
  totalInvoiced: number; totalPaid: number; outstandingPayable: number;
  entries: VendorLedgerEntry[];
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

// ── Workflow Engine ───────────────────────────────────────────────────────────
export type WorkflowDocumentType = 'APInvoice' | 'PurchaseOrder' | 'ARInvoice' | 'SalesOrder' | 'SalesQuotation' | 'ARCreditNote' | 'JournalEntry' | 'ExpenseReport';
export type ApprovalStatus = 'NotRequired' | 'Draft' | 'Submitted' | 'UnderReview' | 'Approved' | 'Rejected' | 'Recalled';

export interface WorkflowTemplateStep {
  id: string; stepOrder: number; stepName: string;
  approverRole?: string; approverUserId?: string; description?: string;
}
export interface WorkflowTemplate {
  id: string; name: string; documentType: WorkflowDocumentType;
  amountThreshold: number; isActive: boolean;
  steps: WorkflowTemplateStep[];
}
export interface WorkflowApprovalStep {
  id: string; stepOrder: number; stepName: string;
  approverRole?: string; approverUserId?: string;
  decision: 'Pending' | 'Approved' | 'Rejected' | 'Skipped';
  actedBy?: string; actedByComments?: string; actedAt?: string;
}
export interface WorkflowInstance {
  id: string; documentType: string; documentId: string;
  documentRef: string; documentAmount: number;
  status: ApprovalStatus; currentStepIndex: number; totalSteps: number;
  submittedBy: string; rejectedReason?: string;
  createdAt: string; completedAt?: string;
  steps: WorkflowApprovalStep[];
}
export interface PendingApproval {
  workflowInstanceId: string; stepId: string;
  documentType: string; documentId: string; documentRef: string;
  documentAmount: number; stepName: string; approverRole?: string;
  submittedBy: string; submittedAt: string;
}

// ── Expense Management ────────────────────────────────────────────────────────
export interface ExpenseCategory {
  id: string; name: string; description?: string;
  glAccountId?: string; limitPerClaim?: number; isActive: boolean;
}
export interface ExpenseLine {
  id: string; categoryId: string; categoryName: string;
  expenseDate: string; amount: number; description: string;
  merchant?: string; receiptUrl?: string; isReimbursable: boolean;
}
export interface ExpenseReport {
  id: string; reportNumber: string; employeeName: string;
  employeeEmail?: string; department?: string; purpose: string;
  periodStart: string; periodEnd: string; currency: string;
  totalAmount: number; approvedAmount: number; paidAmount: number;
  status: string; approvalStatus: ApprovalStatus;
  workflowInstanceId?: string;
  submittedBy?: string; submittedAt?: string;
  approvedBy?: string; approvedAt?: string;
  rejectedReason?: string; notes?: string; createdAt: string;
  lines: ExpenseLine[];
}
export interface ExpenseReportSummary {
  id: string; reportNumber: string; employeeName: string;
  department?: string; purpose: string;
  periodStart: string; periodEnd: string;
  totalAmount: number; status: string; approvalStatus: ApprovalStatus;
  createdAt: string;
}

// ── Currency ──────────────────────────────────────────────────────────────────
export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  exchangeRate: number;
  isBase: boolean;
  isActive: boolean;
  numericCode?: number;
  country?: string;
  rateUpdatedAt?: string;
  createdAt: string;
}
