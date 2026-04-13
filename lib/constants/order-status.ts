export const ORDER_STATUSES = ['NEW', 'PREPARING', 'COMPLETED', 'CANCELLED'] as const;

export type OrderWorkflowStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_TRANSITIONS: Record<OrderWorkflowStatus, readonly OrderWorkflowStatus[]> = {
  NEW: ['PREPARING', 'CANCELLED'],
  PREPARING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export function getAllowedNextStatuses(status: OrderWorkflowStatus): readonly OrderWorkflowStatus[] {
  return ORDER_STATUS_TRANSITIONS[status] ?? [];
}

export function canTransitionStatus(from: OrderWorkflowStatus, to: OrderWorkflowStatus): boolean {
  return getAllowedNextStatuses(from).includes(to);
}
