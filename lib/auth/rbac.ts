export const PERMISSIONS = {
  CATEGORY_MANAGE: 'category:manage',
  PRODUCT_MANAGE: 'product:manage',
  ORDER_MANAGE: 'order:manage',
  TABLE_MANAGE: 'table:manage',
  USER_MANAGE: 'user:manage',
  STORE_MANAGE: 'store:manage',
  REPORT_VIEW: 'report:view'
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PRESETS: Record<string, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS),
  MANAGER: [
    PERMISSIONS.CATEGORY_MANAGE,
    PERMISSIONS.PRODUCT_MANAGE,
    PERMISSIONS.ORDER_MANAGE,
    PERMISSIONS.TABLE_MANAGE,
    PERMISSIONS.REPORT_VIEW
  ],
  STAFF: [PERMISSIONS.ORDER_MANAGE]
};
