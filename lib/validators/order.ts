import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().positive(),
  note: z.string().max(300).optional(),
  options: z
    .array(
      z.object({
        optionId: z.string().cuid(),
        quantity: z.number().int().positive().default(1)
      })
    )
    .default([])
});

export const createOrderSchema = z.object({
  storeId: z.string().cuid(),
  tableId: z.string().cuid().optional(),
  mode: z.enum(['DINE_IN', 'TAKEAWAY']),
  customerNote: z.string().max(300).optional(),
  items: z.array(orderItemSchema).min(1)
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(['NEW', 'PREPARING', 'COMPLETED', 'CANCELLED'])
});
