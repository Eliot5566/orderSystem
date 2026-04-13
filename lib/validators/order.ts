import { z } from 'zod';
import { ORDER_STATUSES } from '@/lib/constants/order-status';

export const orderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(1).max(99),
  note: z.string().trim().max(300).optional(),
  options: z
    .array(
      z.object({
        optionId: z.string().cuid(),
        quantity: z.number().int().min(1).max(10).default(1)
      })
    )
    .max(20)
    .default([])
});

export const createOrderSchema = z.object({
  storeId: z.string().cuid(),
  tableId: z.preprocess((value) => (value === '' ? undefined : value), z.string().cuid().optional()),
  mode: z.enum(['DINE_IN', 'TAKEAWAY']),
  customerNote: z.string().trim().max(300).optional(),
  items: z.array(orderItemSchema).min(1).max(50)
}).superRefine((data, ctx) => {
  if (data.mode === 'DINE_IN' && !data.tableId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'DINE_IN mode requires tableId',
      path: ['tableId']
    });
  }

  if (data.mode === 'TAKEAWAY' && data.tableId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'TAKEAWAY mode should not provide tableId',
      path: ['tableId']
    });
  }
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES)
});

export const orderIdParamSchema = z.object({
  id: z.string().cuid()
});

export const orderListQuerySchema = z.object({
  status: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z.enum(ORDER_STATUSES).optional()
  )
});
