import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Organization,
  ImportJob, ImportJobRow, RowResult, BatchJobConfig,
  Category, Brand, ProductSummary, ProductDetail, InventoryDto, VariantLookup,
  FiscalYear, FiscalPeriod, AccountType, Account, JournalEntry, TrialBalanceLine,
  Customer, SalesOrderSummary, SalesOrder, ARInvoice, ARAgingReport,
  Vendor, PurchaseOrderSummary, PurchaseOrder, APInvoice, APAgingReport
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
  getPeriods = (fyId: string) => this.http.get<FiscalPeriod[]>(`${this.base}/gl/fiscal-years/${fyId}/periods`);
  closePeriod = (id: string) => this.http.post<void>(`${this.base}/gl/periods/${id}/close`, {});
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
  receiveGoods = (id: string, r: any) => this.http.post<void>(`${this.base}/ap/purchase-orders/${id}/receive`, r);
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

  exportData = (entityType: string, fileFormat: string) =>
    this.http.get(`${this.base}/dm/export?entityType=${entityType}&fileFormat=${fileFormat}`,
      { responseType: 'blob', observe: 'response' });

  downloadTemplate = (entityType: string, fileFormat: string) =>
    this.http.get(`${this.base}/dm/template?entityType=${entityType}&fileFormat=${fileFormat}`,
      { responseType: 'blob', observe: 'response' });
}
