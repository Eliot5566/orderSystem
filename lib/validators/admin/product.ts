import { z } from 'zod';

export const createProductSchema = z.object({
  categoryId: z.string().cuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isAvailable: z.coerce.boolean().optional(),
  optionGroupIds: z.array(z.string().cuid()).max(20).default([])
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial().superRefine((data, ctx) => {
  if (Object.keys(data).length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one field is required' });
  }
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
