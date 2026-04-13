import { PERMISSIONS, type Permission } from './rbac';

export const ADMIN_PAGE_PERMISSION_RULES: Array<{ prefix: string; permission?: Permission }> = [
  { prefix: '/admin/users', permission: PERMISSIONS.USER_MANAGE },
  { prefix: '/admin/categories', permission: PERMISSIONS.CATEGORY_MANAGE },
  { prefix: '/admin/products', permission: PERMISSIONS.PRODUCT_MANAGE },
  { prefix: '/admin/option-groups', permission: PERMISSIONS.PRODUCT_MANAGE },
  { prefix: '/admin/orders', permission: PERMISSIONS.ORDER_MANAGE },
  { prefix: '/admin/tables', permission: PERMISSIONS.TABLE_MANAGE },
  { prefix: '/admin/reports', permission: PERMISSIONS.REPORT_VIEW },
  { prefix: '/admin/store-settings', permission: PERMISSIONS.STORE_MANAGE },
  { prefix: '/admin' }
];

export const ADMIN_API_PERMISSION_RULES: Array<{ prefix: string; permission?: Permission }> = [
  { prefix: '/api/admin/users', permission: PERMISSIONS.USER_MANAGE },
  { prefix: '/api/admin/categories', permission: PERMISSIONS.CATEGORY_MANAGE },
  { prefix: '/api/admin/products', permission: PERMISSIONS.PRODUCT_MANAGE },
  { prefix: '/api/admin/option-groups', permission: PERMISSIONS.PRODUCT_MANAGE },
  { prefix: '/api/admin/tables', permission: PERMISSIONS.TABLE_MANAGE },
  { prefix: '/api/admin/reports', permission: PERMISSIONS.REPORT_VIEW },
  { prefix: '/api/admin/dashboard' }
];

function getMatchedPermission(pathname: string, rules: Array<{ prefix: string; permission?: Permission }>) {
  for (const rule of rules) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule.permission;
    }
  }
  return undefined;
}

export function getRequiredAdminPagePermission(pathname: string): Permission | undefined {
  return getMatchedPermission(pathname, ADMIN_PAGE_PERMISSION_RULES);
}

export function getRequiredAdminApiPermission(pathname: string): Permission | undefined {
  return getMatchedPermission(pathname, ADMIN_API_PERMISSION_RULES);
}
