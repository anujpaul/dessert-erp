import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Organization,
  ImportJob, ImportJobRow, RowResult, BatchJobConfig,
  Category, Brand, ProductSummary, ProductDetail, InventoryDto, VariantLookup,
  FiscalYear, FiscalPeriod, AccountType, Account, JournalEntry, TrialBalanceLine,
  Customer, SalesOrderSummary, SalesOrder, ARInvoice, ARAgingReport,
  Vendor, PurchaseOrderSummary, PurchaseOrder, APInvoice, APAgingReport,
  RetailStore, POSTransactionSummary, POSTransaction, Promotion, Coupon,
  CouponValidationResult, RetailSummary,
  Campaign, LoyaltyProgram, CustomerLoyaltyAccount
} from '../models/erp.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // ── Organizations ──────────────────────────────────────────────────────────
  getOrganizations = () => this.http.get<Organization[]>(`${this.base}/organizations`);
  createOrganization = (r: any) => this.http.post<Organization>(`${this.base}/organizations`, r);
  updateOrganization = (id: string, r: any) => this.http.put<void>(`${this.base}/organizations/${id}`, r);
  activateOrganization = (id: string) => this.http.post<void>(`${this.base}/organizations/${id}/activate`, {});
  suspendOrganization  = (id: string) => this.http.post<void>(`${this.base}/organizations/${id}/suspend`, {});
  deleteOrganization   = (id: string) => this.http.delete<void>(`${this.base}/organizations/${id}`);

  // ── Product Management ─────────────────────────────────────────────────────
  getCategories = () => this.http.get<Category[]>(`${this.base}/pm/categories`);
  createCategory = (r: any) => this.http.post<Category>(`${this.base}/pm/categories`, r);
  deleteCategory = (id: string) => this.http.delete<void>(`${this.base}/pm/categories/${id}`);
  deleteBrand    = (id: string) => this.http.delete<void>(`${this.base}/pm/brands/${id}`);

  getBrands = () => this.http.get<Brand[]>(`${this.base}/pm/brands`);
  createBrand = (r: any) => this.http.post<Brand>(`${this.base}/pm/brands`, r);

  getProducts = (params?: { categoryId?: string; brandId?: string; status?: string; search?: string }) => {
    let p = new HttpParams();
    if (params?.categoryId) p = p.set('categoryId', params.categoryId);
    if (params?.brandId) p = p.set('brandId', params.brandId);
    if (params?.status) p = p.set('status', params.status);
    if (params?.search) p = p.set('search', params.search);
    return this.http.get<ProductSummary[]>(`${this.base}/pm/products`, { params: p });
  };
  getProduct = (id: string) => this.http.get<ProductDetail>(`${this.base}/pm/products/${id}`);
  createProduct = (r: any) => this.http.post<ProductDetail>(`${this.base}/pm/products`, r);
  updateProduct = (id: string, r: any) => this.http.put<ProductDetail>(`${this.base}/pm/products/${id}`, r);
  changeProductStatus = (id: string, status: string) => this.http.post<void>(`${this.base}/pm/products/${id}/status/${status}`, {});

  addVariant = (productId: string, r: any) => this.http.post<any>(`${this.base}/pm/products/${productId}/variants`, r);
  updateVariantPricing = (variantId: string, r: any) => this.http.put<void>(`${this.base}/pm/variants/${variantId}/pricing`, r);
  deactivateVariant = (variantId: string) => this.http.post<void>(`${this.base}/pm/variants/${variantId}/deactivate`, {});

  getInventory = (needsReorder = false) =>
    this.http.get<InventoryDto[]>(`${this.base}/pm/inventory?needsReorder=${needsReorder}`);
  adjustInventory = (variantId: string, r: any) =>
    this.http.post<void>(`${this.base}/pm/inventory/${variantId}/adjust`, r);
  setInventory = (variantId: string, r: any) =>
    this.http.post<void>(`${this.base}/pm/inventory/${variantId}/set`, r);
  updateThresholds = (variantId: string, r: any) =>
    this.http.put<void>(`${this.base}/pm/inventory/${variantId}/thresholds`, r);

  searchVariants = (q: string) => {
    const p = new HttpParams().set('q', q);
    return this.http.get<VariantLookup[]>(`${this.base}/pm/variants/search`, { params: p });
  };

  // ── General Ledger ─────────────────────────────────────────────────────────
  getFiscalYears = () => this.http.get<FiscalYear[]>(`${this.base}/gl/fiscal-years`);
  createFiscalYear = (r: any) => this.http.post<FiscalYear>(`${this.base}/gl/fiscal-years`, r);
  closeFiscalYear = (id: string) => this.http.post<void>(`${this.base}/gl/fiscal-years/${id}/close`, {});
  getPeriods      = (fyId: string) => this.http.get<FiscalPeriod[]>(`${this.base}/gl/fiscal-years/${fyId}/periods`);
  createPeriod    = (fyId: string, r: any) => this.http.post<FiscalPeriod>(`${this.base}/gl/fiscal-years/${fyId}/periods`, r);
  generatePeriods = (fyId: string, type: string) => this.http.post<FiscalPeriod[]>(`${this.base}/gl/fiscal-years/${fyId}/periods/generate`, { type });
  updatePeriod    = (fyId: string, pid: string, r: any) => this.http.put<FiscalPeriod>(`${this.base}/gl/fiscal-years/${fyId}/periods/${pid}`, r);
  deletePeriod    = (fyId: string, pid: string) => this.http.delete<void>(`${this.base}/gl/fiscal-years/${fyId}/periods/${pid}`);
  closePeriod     = (id: string) => this.http.post<void>(`${this.base}/gl/periods/${id}/close`, {});
  getCurrentPeriod = () => this.http.get<FiscalPeriod>(`${this.base}/gl/periods/current`);

  getAccountTypes = () => this.http.get<AccountType[]>(`${this.base}/gl/account-types`);
  getAccounts = () => this.http.get<Account[]>(`${this.base}/gl/accounts`);
  createAccount = (r: any) => this.http.post<Account>(`${this.base}/gl/accounts`, r);
  deactivateAccount = (id: string) => this.http.post<void>(`${this.base}/gl/accounts/${id}/deactivate`, {});

  getJournalEntries = (fiscalPeriodId?: string) => {
    let params = new HttpParams();
    if (fiscalPeriodId) params = params.set('fiscalPeriodId', fiscalPeriodId);
    return this.http.get<JournalEntry[]>(`${this.base}/gl/journal-entries`, { params });
  };
  createJournalEntry = (r: any) => this.http.post<JournalEntry>(`${this.base}/gl/journal-entries`, r);
  postJournalEntry = (id: string) => this.http.post<void>(`${this.base}/gl/journal-entries/${id}/post`, {});
  voidJournalEntry = (id: string) => this.http.post<void>(`${this.base}/gl/journal-entries/${id}/void`, {});
  getTrialBalance = (periodId: string) =>
    this.http.get<TrialBalanceLine[]>(`${this.base}/gl/reports/trial-balance?fiscalPeriodId=${periodId}`);

  // ── Accounts Receivable ────────────────────────────────────────────────────
  getCustomers = () => this.http.get<Customer[]>(`${this.base}/ar/customers`);
  createCustomer = (r: any) => this.http.post<Customer>(`${this.base}/ar/customers`, r);

  getSalesOrders = (status?: string, customerId?: string) => {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (customerId) params = params.set('customerId', customerId);
    return this.http.get<SalesOrderSummary[]>(`${this.base}/ar/sales-orders`, { params });
  };
  getSalesOrder = (id: string) => this.http.get<SalesOrder>(`${this.base}/ar/sales-orders/${id}`);
  createSalesOrder = (r: any) => this.http.post<SalesOrder>(`${this.base}/ar/sales-orders`, r);
  addSalesOrderLine = (id: string, r: any) =>
    this.http.post<SalesOrder>(`${this.base}/ar/sales-orders/${id}/lines`, r);
  removeSalesOrderLine = (id: string, lineId: string) =>
    this.http.delete<void>(`${this.base}/ar/sales-orders/${id}/lines/${lineId}`);
  confirmSalesOrder = (id: string) => this.http.post<void>(`${this.base}/ar/sales-orders/${id}/confirm`, {});
  startPicking = (id: string) => this.http.post<void>(`${this.base}/ar/sales-orders/${id}/picking`, {});
  shipSalesOrder = (id: string, r: any) => this.http.post<void>(`${this.base}/ar/sales-orders/${id}/ship`, r);
  cancelSalesOrder = (id: string) => this.http.post<void>(`${this.base}/ar/sales-orders/${id}/cancel`, {});
  applySalesOrderDiscount = (id: string, discountPct: number) =>
    this.http.post<SalesOrder>(`${this.base}/ar/sales-orders/${id}/apply-discount`, { discountPct });
  generateARInvoice = (orderId: string) =>
    this.http.post<ARInvoice>(`${this.base}/ar/sales-orders/${orderId}/generate-invoice`, {});

  getARInvoices = (customerId?: string) => {
    let params = new HttpParams();
    if (customerId) params = params.set('customerId', customerId);
    return this.http.get<ARInvoice[]>(`${this.base}/ar/invoices`, { params });
  };
  issueInvoice = (id: string) => this.http.post<void>(`${this.base}/ar/invoices/${id}/issue`, {});
  voidARInvoice = (id: string) => this.http.post<void>(`${this.base}/ar/invoices/${id}/void`, {});
  createARPayment = (r: any) => this.http.post<any>(`${this.base}/ar/payments`, r);
  getARAgingReport = () => this.http.get<ARAgingReport[]>(`${this.base}/ar/reports/aging`);

  setPreferredVendor = (productId: string, vendorId: string | null) =>
    this.http.put<void>(`${this.base}/pm/products/${productId}/preferred-vendor`, { vendorId });

  // ── Accounts Payable ───────────────────────────────────────────────────────
  getVendors = () => this.http.get<Vendor[]>(`${this.base}/ap/vendors`);
  createVendor = (r: any) => this.http.post<Vendor>(`${this.base}/ap/vendors`, r);
  updateVendor = (id: string, r: any) => this.http.put<Vendor>(`${this.base}/ap/vendors/${id}`, r);
  deleteVendor  = (id: string) => this.http.delete<void>(`${this.base}/ap/vendors/${id}`);

  getPurchaseOrders = (status?: string, vendorId?: string) => {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (vendorId) params = params.set('vendorId', vendorId);
    return this.http.get<PurchaseOrderSummary[]>(`${this.base}/ap/purchase-orders`, { params });
  };
  getPurchaseOrder = (id: string) => this.http.get<PurchaseOrder>(`${this.base}/ap/purchase-orders/${id}`);
  createPurchaseOrder = (r: any) => this.http.post<PurchaseOrder>(`${this.base}/ap/purchase-orders`, r);
  addPOLine = (id: string, r: any) =>
    this.http.post<PurchaseOrder>(`${this.base}/ap/purchase-orders/${id}/lines`, r);
  removePOLine = (id: string, lineId: string) =>
    this.http.delete<void>(`${this.base}/ap/purchase-orders/${id}/lines/${lineId}`);
  sendPurchaseOrder = (id: string) => this.http.post<void>(`${this.base}/ap/purchase-orders/${id}/send`, {});
  recordReceipt = (id: string, req: { lines: { lineId: string; qty: number }[]; receivedDate?: string; notes?: string }) =>
    this.http.post<any>(`${this.base}/ap/purchase-orders/${id}/receipts`, req);
  getPOReceipts = (id: string) => this.http.get<any[]>(`${this.base}/ap/purchase-orders/${id}/receipts`);
  closePurchaseOrder = (id: string) => this.http.post<void>(`${this.base}/ap/purchase-orders/${id}/close`, {});
  cancelPurchaseOrder = (id: string) => this.http.post<void>(`${this.base}/ap/purchase-orders/${id}/cancel`, {});
  generateAPInvoice = (poId: string, ref: string) =>
    this.http.post<APInvoice>(`${this.base}/ap/purchase-orders/${poId}/generate-invoice?vendorInvoiceRef=${ref}`, {});

  getAPInvoices = (vendorId?: string) => {
    let params = new HttpParams();
    if (vendorId) params = params.set('vendorId', vendorId);
    return this.http.get<APInvoice[]>(`${this.base}/ap/invoices`, { params });
  };
  createAPInvoice = (r: any) => this.http.post<APInvoice>(`${this.base}/ap/invoices`, r);
  approveAPInvoice = (id: string) => this.http.post<void>(`${this.base}/ap/invoices/${id}/approve`, {});
  voidAPInvoice = (id: string) => this.http.post<void>(`${this.base}/ap/invoices/${id}/void`, {});
  createAPPayment = (r: any) => this.http.post<any>(`${this.base}/ap/payments`, r);
  getAPAgingReport = () => this.http.get<APAgingReport[]>(`${this.base}/ap/reports/aging`);

  // ── Data Management ────────────────────────────────────────────────────────
  getImportJobs = () => this.http.get<ImportJob[]>(`${this.base}/dm/import-jobs`);
  getImportJob  = (id: string) => this.http.get<ImportJob>(`${this.base}/dm/import-jobs/${id}`);
  getImportJobRows = (id: string, page = 1, pageSize = 100) =>
    this.http.get<ImportJobRow[]>(`${this.base}/dm/import-jobs/${id}/rows?page=${page}&pageSize=${pageSize}`);

  /** Full pipeline: stage + validate + promote in one request (good for small/medium files) */
  uploadImport = (file: File, entityType: string, fileFormat: string) => {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ job: ImportJob; rowResults: RowResult[] }>(
      `${this.base}/dm/import?entityType=${entityType}&fileFormat=${fileFormat}`, form);
  };

  /** Stage + validate only — user reviews errors, then calls promoteImport() */
  stageImport = (file: File, entityType: string, fileFormat: string) => {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ job: ImportJob; message: string }>(
      `${this.base}/dm/import/stage?entityType=${entityType}&fileFormat=${fileFormat}`, form);
  };

  /** Promote Valid staging rows to real tables */
  promoteImport = (jobId: string) =>
    this.http.post<{ job: ImportJob }>(`${this.base}/dm/import-jobs/${jobId}/promote`, {});

  // ── Batch Jobs ──────────────────────────────────────────────────────────────
  getBatchJobs    = () => this.http.get<BatchJobConfig[]>(`${this.base}/batch-jobs`);
  getBatchJob     = (id: string) => this.http.get<BatchJobConfig>(`${this.base}/batch-jobs/${id}`);
  createBatchJob  = (req: Partial<BatchJobConfig> & { cronExpression: string }) =>
    this.http.post<BatchJobConfig>(`${this.base}/batch-jobs`, req);
  updateBatchJob  = (id: string, req: any) =>
    this.http.put<BatchJobConfig>(`${this.base}/batch-jobs/${id}`, req);
  deleteBatchJob  = (id: string) => this.http.delete(`${this.base}/batch-jobs/${id}`);
  enableBatchJob  = (id: string) => this.http.post(`${this.base}/batch-jobs/${id}/enable`, {});
  disableBatchJob = (id: string) => this.http.post(`${this.base}/batch-jobs/${id}/disable`, {});
  triggerBatchJob = (id: string) =>
    this.http.post<{ message: string; hangfireJobId: string }>(`${this.base}/batch-jobs/${id}/trigger`, {});
  resetExport = (entityType: string, entityIds: string[]) =>
    this.http.post<{ message: string; count: number }>(`${this.base}/batch-jobs/reset-export`, { entityType, entityIds });
  getExportHistory = (entityType?: string) => {
    let params = new HttpParams();
    if (entityType) params = params.set('entityType', entityType);
    return this.http.get<any[]>(`${this.base}/batch-jobs/export-history`, { params });
  };

  // ── Retail ─────────────────────────────────────────────────────────────────
  getRetailStores     = () => this.http.get<RetailStore[]>(`${this.base}/omnichannel/stores`);
  createRetailStore   = (r: any) => this.http.post<RetailStore>(`${this.base}/omnichannel/stores`, r);
  updateRetailStore   = (id: string, r: any) => this.http.put<RetailStore>(`${this.base}/omnichannel/stores/${id}`, r);
  toggleRetailStore   = (id: string, active: boolean) =>
    this.http.post(`${this.base}/omnichannel/stores/${id}/toggle?active=${active}`, {});

  getTransactions = (page = 1, pageSize = 50, status?: string) => {
    let p = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) p = p.set('status', status);
    return this.http.get<POSTransactionSummary[]>(`${this.base}/omnichannel/transactions`, { params: p });
  };
  getTransaction    = (id: string) => this.http.get<POSTransaction>(`${this.base}/omnichannel/transactions/${id}`);
  createTransaction = (r: any) => this.http.post<POSTransaction>(`${this.base}/omnichannel/transactions`, r);
  voidTransaction          = (id: string) => this.http.post(`${this.base}/omnichannel/transactions/${id}/void`, {});
  updateFulfillmentStatus  = (id: string, fulfillmentStatus: string) =>
    this.http.patch(`${this.base}/omnichannel/transactions/${id}/fulfillment`, { fulfillmentStatus });
  createOnlineOrder = (r: any) => this.http.post<POSTransaction>(`${this.base}/omnichannel/orders/online`, r);

  getPromotions    = () => this.http.get<Promotion[]>(`${this.base}/omnichannel/promotions`);
  createPromotion  = (r: any) => this.http.post<Promotion>(`${this.base}/omnichannel/promotions`, r);
  updatePromotion  = (id: string, r: any) => this.http.put<Promotion>(`${this.base}/omnichannel/promotions/${id}`, r);
  togglePromotion  = (id: string, active: boolean) =>
    this.http.post(`${this.base}/omnichannel/promotions/${id}/toggle?active=${active}`, {});

  getCoupons        = (promotionId?: string) => {
    let p = new HttpParams();
    if (promotionId) p = p.set('promotionId', promotionId);
    return this.http.get<Coupon[]>(`${this.base}/omnichannel/coupons`, { params: p });
  };
  createCoupon      = (r: any) => this.http.post<Coupon>(`${this.base}/omnichannel/coupons`, r);
  bulkCreateCoupons = (r: any) => this.http.post<Coupon[]>(`${this.base}/omnichannel/coupons/bulk`, r);
  validateCoupon    = (r: { code: string; orderAmount: number }) =>
    this.http.post<CouponValidationResult>(`${this.base}/omnichannel/coupons/validate`, r);
  deactivateCoupon  = (id: string) => this.http.post(`${this.base}/omnichannel/coupons/${id}/deactivate`, {});

  getRetailSummary = (from?: string, to?: string) => {
    let p = new HttpParams();
    if (from) p = p.set('from', from);
    if (to)   p = p.set('to', to);
    return this.http.get<RetailSummary>(`${this.base}/omnichannel/summary`, { params: p });
  };

  // ── Marketing ──────────────────────────────────────────────────────────────
  // Campaigns
  getCampaigns     = () => this.http.get<Campaign[]>(`${this.base}/marketing/campaigns`);
  getCampaign      = (id: string) => this.http.get<Campaign>(`${this.base}/marketing/campaigns/${id}`);
  createCampaign   = (r: any) => this.http.post<Campaign>(`${this.base}/marketing/campaigns`, r);
  updateCampaign   = (id: string, r: any) => this.http.put<Campaign>(`${this.base}/marketing/campaigns/${id}`, r);
  setCampaignStatus = (id: string, status: string) =>
    this.http.patch<Campaign>(`${this.base}/marketing/campaigns/${id}/status`, { status });
  recordCampaignMetrics = (id: string, r: any) =>
    this.http.post<Campaign>(`${this.base}/marketing/campaigns/${id}/metrics`, r);
  deleteCampaign   = (id: string) => this.http.delete(`${this.base}/marketing/campaigns/${id}`);

  // Marketing Promotions
  getMarketingPromotions   = () => this.http.get<Promotion[]>(`${this.base}/marketing/promotions`);
  createMarketingPromotion = (r: any) => this.http.post<Promotion>(`${this.base}/marketing/promotions`, r);
  updateMarketingPromotion = (id: string, r: any) => this.http.put<Promotion>(`${this.base}/marketing/promotions/${id}`, r);
  toggleMarketingPromotion = (id: string) => this.http.patch<Promotion>(`${this.base}/marketing/promotions/${id}/toggle`, {});
  deleteMarketingPromotion = (id: string) => this.http.delete(`${this.base}/marketing/promotions/${id}`);

  // Marketing Coupons
  getMarketingCoupons = (promotionId?: string) => {
    let p = new HttpParams();
    if (promotionId) p = p.set('promotionId', promotionId);
    return this.http.get<Coupon[]>(`${this.base}/marketing/coupons`, { params: p });
  };
  createMarketingCoupon     = (r: any) => this.http.post<Coupon>(`${this.base}/marketing/coupons`, r);
  bulkCreateMarketingCoupons = (r: any) => this.http.post<Coupon[]>(`${this.base}/marketing/coupons/bulk`, r);
  validateMarketingCoupon   = (code: string, orderAmount = 0) =>
    this.http.get<CouponValidationResult>(`${this.base}/marketing/coupons/validate?code=${code}&orderAmount=${orderAmount}`);
  deactivateMarketingCoupon = (id: string) => this.http.patch(`${this.base}/marketing/coupons/${id}/deactivate`, {});

  // Loyalty Programs
  getLoyaltyPrograms     = () => this.http.get<LoyaltyProgram[]>(`${this.base}/marketing/loyalty`);
  getLoyaltyProgram      = (id: string) => this.http.get<LoyaltyProgram>(`${this.base}/marketing/loyalty/${id}`);
  createLoyaltyProgram   = (r: any) => this.http.post<LoyaltyProgram>(`${this.base}/marketing/loyalty`, r);
  updateLoyaltyProgram   = (id: string, r: any) => this.http.put<LoyaltyProgram>(`${this.base}/marketing/loyalty/${id}`, r);
  toggleLoyaltyProgram   = (id: string) => this.http.patch<LoyaltyProgram>(`${this.base}/marketing/loyalty/${id}/toggle`, {});
  getLoyaltyAccounts     = (programId: string) =>
    this.http.get<CustomerLoyaltyAccount[]>(`${this.base}/marketing/loyalty/${programId}/accounts`);
  enrollCustomer         = (programId: string, r: any) =>
    this.http.post<CustomerLoyaltyAccount>(`${this.base}/marketing/loyalty/${programId}/enroll`, r);
  awardPoints            = (programId: string, r: any) =>
    this.http.post<CustomerLoyaltyAccount>(`${this.base}/marketing/loyalty/${programId}/award`, r);
  redeemPoints           = (programId: string, r: any) =>
    this.http.post<CustomerLoyaltyAccount>(`${this.base}/marketing/loyalty/${programId}/redeem`, r);

  // ── Trade / Price Agreements ──────────────────────────────────────────────
  getPriceAgreements = (params?: { productId?: string; activeOnly?: boolean }) => {
    let p = new HttpParams();
    if (params?.productId)  p = p.set('productId', params.productId);
    if (params?.activeOnly) p = p.set('activeOnly', 'true');
    return this.http.get<any[]>(`${this.base}/price-agreements`, { params: p });
  };
  createPriceAgreement = (r: any) => this.http.post<any>(`${this.base}/price-agreements`, r);
  updatePriceAgreement = (id: string, r: any) => this.http.put<any>(`${this.base}/price-agreements/${id}`, r);
  deletePriceAgreement = (id: string) => this.http.delete<void>(`${this.base}/price-agreements/${id}`);
  getEffectivePrice    = (variantId: string) =>
    this.http.get<any>(`${this.base}/price-agreements/effective-price/${variantId}`);
  bulkApplyPriceAgreement = (productId: string, r: any) =>
    this.http.post<any>(`${this.base}/price-agreements/bulk-apply?productId=${productId}`, r);
  getPriceAgreementSuggestions = (productId: string) =>
    this.http.get<any[]>(`${this.base}/price-agreements/suggestions?productId=${productId}`);

  // ── Data Management ──────────────────────────────────────────────────────
  exportData = (entityType: string, fileFormat: string) =>
    this.http.get(`${this.base}/dm/export?entityType=${entityType}&fileFormat=${fileFormat}`,
      { responseType: 'blob', observe: 'response' });


  downloadTemplate = (entityType: string, fileFormat: string) =>
    this.http.get(`${this.base}/dm/template?entityType=${entityType}&fileFormat=${fileFormat}`,
      { responseType: 'blob', observe: 'response' });

  importFile = (entityType: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<any>(`${this.base}/dm/import?entityType=${entityType}`, fd);
  };

  // ── AP Prepayment + Three-Way Match ──────────────────────────────────────
  createPrepaymentInvoice = (req: {
    vendorId: string; purchaseOrderId: string; vendorInvoiceRef: string;
    invoiceDate: string; dueDate: string; amount: number; taxAmount?: number; description?: string;
  }) => this.http.post<any>(`${this.base}/ap/invoices/prepayment`, req);

  runThreeWayMatch = (invoiceId: string) =>
    this.http.post<any>(`${this.base}/ap/invoices/${invoiceId}/match`, {});

  bypassMatch = (invoiceId: string, reason: string) =>
    this.http.post<any>(`${this.base}/ap/invoices/${invoiceId}/bypass-match`, { reason });

  applyPrepayment = (invoiceId: string, prepaymentInvoiceId: string) =>
    this.http.post<any>(`${this.base}/ap/invoices/${invoiceId}/apply-prepayment/${prepaymentInvoiceId}`, {});

}
