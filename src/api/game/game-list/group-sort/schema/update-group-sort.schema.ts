import z from 'zod';

import {
  fileArraySchema,
  fileSchema,
  StringToBooleanSchema,
  StringToObjectSchema,
} from '@/common';

import { GroupSortCategorySchema } from './create-group-sort.schema';

export const UpdateGroupSortSchema = z.object({
  name: z.string().max(128).trim().optional(),
  description: z.string().max(256).trim().optional(),
  thumbnail_image: fileSchema({}).optional(),
  is_publish: StringToBooleanSchema.optional(),
  is_category_randomized: StringToBooleanSchema.optional(),
  is_item_randomized: StringToBooleanSchema.optional(),
  score_per_item: z.coerce.number().min(1).max(1000).optional(),
  time_limit: z.coerce.number().min(30).max(600).optional(),
  files_to_upload: fileArraySchema({
    max_size: 2 * 1024 * 1024,
    min_amount: 0,
    max_amount: 50,
  }).optional(),
  categories: StringToObjectSchema(
    z.array(GroupSortCategorySchema).min(2).max(10),
  ).optional(),
});

export type IUpdateGroupSort = z.infer<typeof UpdateGroupSortSchema>;
