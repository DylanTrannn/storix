import { z } from 'zod';
import { PRODUCT_SORT_FIELDS, SORT_DIRECTIONS } from '../constants.js';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const ProductListQuerySchema = PaginationQuerySchema.extend({
  sort: z.enum(PRODUCT_SORT_FIELDS).optional(),
  direction: z.enum(SORT_DIRECTIONS).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  collectionId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  });

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
