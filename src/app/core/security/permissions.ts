export const PERMISSIONS = {
  glAccess: 'gl:access',
  arAccess: 'ar:access',
  apAccess: 'ap:access',
  productAccess: 'product:access',
  inventoryAccess: 'inventory:access',
  dataAccess: 'data:access',
  marketingAccess: 'marketing:access',
  omniChannelAccess: 'omnichannel:access',
  workflowAccess: 'workflow:access',
  expenseAccess: 'expense:access',
  cashBankAccess: 'cash-bank:access',
  fixedAssetsAccess: 'fixed-assets:access',
  systemAccess: 'system:access',

  glJournalView: 'gl.journal:view',
  glJournalManage: 'gl.journal:manage',
  glJournalPost: 'gl.journal:post',
  arCustomerView: 'ar.customer:view',
  arCustomerManage: 'ar.customer:manage',
  arSalesOrderView: 'ar.sales-order:view',
  arSalesOrderManage: 'ar.sales-order:manage',
  arSalesOrderConfirm: 'ar.sales-order:confirm',
  arSalesOrderShip: 'ar.sales-order:ship',
  arInvoiceView: 'ar.invoice:view',
  arInvoiceManage: 'ar.invoice:manage',
  arInvoicePost: 'ar.invoice:post',
  apVendorView: 'ap.vendor:view',
  apVendorManage: 'ap.vendor:manage',
  apPurchaseOrderView: 'ap.purchase-order:view',
  apPurchaseOrderManage: 'ap.purchase-order:manage',
  apPurchaseOrderApprove: 'ap.purchase-order:approve',
  apPurchaseOrderReceive: 'ap.purchase-order:receive',
  apInvoiceView: 'ap.invoice:view',
  apInvoiceManage: 'ap.invoice:manage',
  apInvoiceApprove: 'ap.invoice:approve',
  productCatalogView: 'product.catalog:view',
  productCatalogManage: 'product.catalog:manage',
  inventoryStockView: 'inventory.stock:view',
  inventoryStockAdjust: 'inventory.stock:adjust',
  warehouseView: 'inventory.warehouse:view',
  warehouseManage: 'inventory.warehouse:manage',
  warehouseOperate: 'inventory.warehouse:operate',
  dataImport: 'data.import:manage',
  dataExport: 'data.export:view',
  dataJobsManage: 'data.jobs:manage',
  systemUsersView: 'system.users:view',
  systemUsersManage: 'system.users:manage',
  systemRolesView: 'system.roles:view',
  systemRolesManage: 'system.roles:manage',
  systemAuditView: 'system.audit:view',
  systemSettingsManage: 'system.settings:manage'
} as const;

export interface PermissionDefinition {
  key: string;
  area: string;
  label: string;
  description: string;
}

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  p(PERMISSIONS.glJournalView, 'General Ledger', 'View journals and reports', 'View accounts, periods, journals, and financial reports'),
  p(PERMISSIONS.glJournalManage, 'General Ledger', 'Maintain journals', 'Create and edit accounts, periods, and journals'),
  p(PERMISSIONS.glJournalPost, 'General Ledger', 'Post journals', 'Post or void journal entries'),
  p(PERMISSIONS.arCustomerView, 'Accounts Receivable', 'View customers', 'View customers and customer ledgers'),
  p(PERMISSIONS.arCustomerManage, 'Accounts Receivable', 'Maintain customers', 'Create and edit customers'),
  p(PERMISSIONS.arSalesOrderView, 'Accounts Receivable', 'View sales orders', 'View sales orders and history'),
  p(PERMISSIONS.arSalesOrderManage, 'Accounts Receivable', 'Maintain sales orders', 'Create and edit sales orders'),
  p(PERMISSIONS.arSalesOrderConfirm, 'Accounts Receivable', 'Confirm sales orders', 'Confirm, approve, reject, or cancel sales orders'),
  p(PERMISSIONS.arSalesOrderShip, 'Accounts Receivable', 'Ship sales orders', 'Pick and ship sales orders'),
  p(PERMISSIONS.arInvoiceView, 'Accounts Receivable', 'View receivables', 'View invoices, payments, aging, and credit activity'),
  p(PERMISSIONS.arInvoiceManage, 'Accounts Receivable', 'Maintain receivables', 'Create invoices and payments'),
  p(PERMISSIONS.arInvoicePost, 'Accounts Receivable', 'Post receivables', 'Issue or void customer invoices'),
  p(PERMISSIONS.apVendorView, 'Accounts Payable', 'View vendors', 'View vendors and vendor ledgers'),
  p(PERMISSIONS.apVendorManage, 'Accounts Payable', 'Maintain vendors', 'Create and edit vendors'),
  p(PERMISSIONS.apPurchaseOrderView, 'Accounts Payable', 'View purchase orders', 'View purchase orders and receipts'),
  p(PERMISSIONS.apPurchaseOrderManage, 'Accounts Payable', 'Maintain purchase orders', 'Create and edit purchase orders'),
  p(PERMISSIONS.apPurchaseOrderApprove, 'Accounts Payable', 'Approve purchase orders', 'Approve, send, close, or cancel purchase orders'),
  p(PERMISSIONS.apPurchaseOrderReceive, 'Accounts Payable', 'Receive purchase orders', 'Receive purchase orders into inventory'),
  p(PERMISSIONS.apInvoiceView, 'Accounts Payable', 'View payables', 'View invoices, payments, and aging'),
  p(PERMISSIONS.apInvoiceManage, 'Accounts Payable', 'Maintain payables', 'Create, match, and pay invoices'),
  p(PERMISSIONS.apInvoiceApprove, 'Accounts Payable', 'Approve payables', 'Approve or void supplier invoices'),
  p(PERMISSIONS.productCatalogView, 'Product Management', 'View product catalog', 'View products, variants, brands, and categories'),
  p(PERMISSIONS.productCatalogManage, 'Product Management', 'Maintain product catalog', 'Maintain products, variants, brands, and categories'),
  p(PERMISSIONS.inventoryStockView, 'Inventory', 'View stock', 'View stock balances and transactions'),
  p(PERMISSIONS.inventoryStockAdjust, 'Inventory', 'Adjust stock', 'Adjust inventory quantities and thresholds'),
  p(PERMISSIONS.warehouseView, 'Inventory', 'View warehouses', 'View warehouses and warehouse orders'),
  p(PERMISSIONS.warehouseManage, 'Inventory', 'Maintain warehouses', 'Maintain warehouses and locations'),
  p(PERMISSIONS.warehouseOperate, 'Inventory', 'Operate warehouses', 'Receive, pick, ship, and transfer stock'),
  p(PERMISSIONS.dataImport, 'Data Management', 'Manage imports', 'Upload, stage, and promote imports'),
  p(PERMISSIONS.dataExport, 'Data Management', 'Export data', 'Export business data and templates'),
  p(PERMISSIONS.dataJobsManage, 'Data Management', 'Manage batch jobs', 'Create, schedule, and trigger batch jobs'),
  p(PERMISSIONS.marketingAccess, 'Marketing', 'Use marketing', 'Use campaigns, loyalty, and trade agreements'),
  p(PERMISSIONS.omniChannelAccess, 'OmniChannel', 'Use OmniChannel', 'Use channel order and fulfillment features'),
  p(PERMISSIONS.workflowAccess, 'Approvals', 'Use approvals', 'Use approval inbox and workflow actions'),
  p(PERMISSIONS.expenseAccess, 'Expenses', 'Use expenses', 'Use expense management'),
  p(PERMISSIONS.cashBankAccess, 'Cash and Bank', 'Use cash and bank', 'Use cash and bank management'),
  p(PERMISSIONS.fixedAssetsAccess, 'Fixed Assets', 'Use fixed assets', 'Use fixed asset management'),
  p(PERMISSIONS.systemUsersView, 'System Administration', 'View users', 'View user accounts'),
  p(PERMISSIONS.systemUsersManage, 'System Administration', 'Manage users', 'Create, edit, activate, and reset users'),
  p(PERMISSIONS.systemRolesView, 'System Administration', 'View roles', 'View roles and permissions'),
  p(PERMISSIONS.systemRolesManage, 'System Administration', 'Manage roles', 'Create and edit roles'),
  p(PERMISSIONS.systemAuditView, 'System Administration', 'View audit history', 'View security and business audit history'),
  p(PERMISSIONS.systemSettingsManage, 'System Administration', 'Manage settings', 'Maintain organization settings')
];

export function permissionParts(key: string): { module: string; action: string } {
  const separator = key.lastIndexOf(':');
  return { module: key.slice(0, separator), action: key.slice(separator + 1) };
}

export function expandStoredPermissions(
  permissions: { module: string; action: string }[],
  isAdmin = false
): string[] {
  if (isAdmin) return PERMISSION_CATALOG.map(permission => permission.key);

  const keys = new Set<string>();
  for (const permission of permissions) {
    const legacy = legacyCapabilities(permission.module, permission.action);
    if (legacy.length) legacy.forEach(key => keys.add(key));
    else keys.add(`${permission.module.toLowerCase()}:${permission.action.toLowerCase()}`);
  }
  return [...keys];
}

function legacyCapabilities(module: string, action: string): string[] {
  const prefixes: Record<string, string[]> = {
    GL: ['gl.'],
    AR: ['ar.'],
    AP: ['ap.'],
    PM: ['product.', 'inventory.'],
    SysAdmin: ['system.']
  };
  const selectedPrefixes = prefixes[module];
  if (!selectedPrefixes) return [];

  const candidates = PERMISSION_CATALOG
    .map(permission => permission.key)
    .filter(key => selectedPrefixes.some(prefix => key.startsWith(prefix)));

  switch (action.toLowerCase()) {
    case 'read':
      return candidates.filter(key => key.endsWith(':view') || key.endsWith(':access'));
    case 'write':
      return candidates.filter(key => !key.endsWith(':view') && !key.endsWith(':access'));
    case 'delete':
      return candidates.filter(key => key.endsWith(':manage'));
    case 'approve':
      return candidates.filter(key =>
        key.endsWith(':approve') || key.endsWith(':confirm') || key.endsWith(':post'));
    default:
      return [];
  }
}

function p(key: string, area: string, label: string, description: string): PermissionDefinition {
  return { key, area, label, description };
}
