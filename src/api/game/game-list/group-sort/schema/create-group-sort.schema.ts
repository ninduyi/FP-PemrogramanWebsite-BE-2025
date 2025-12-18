import z from 'zod';

import { StringToBooleanSchema } from '@/common';

export const GroupSortItemSchema = z.object({
  item_text: z.string().max(512).trim(),
  item_image: z.string().nullable().optional(),
  item_hint: z.string().max(256).trim().optional(),
});

export const GroupSortCategorySchema = z.object({
  category_name: z.string().max(256).trim(),
  items: z.array(GroupSortItemSchema).min(1).max(20),
});

export const CreateGroupSortSchema = z.object({
  name: z.string().max(128).trim(),
  description: z.string().max(256).trim().optional(),
  thumbnail_image: z.string().nullable().optional(),
  is_publish_immediately: StringToBooleanSchema.default(false),
  is_category_randomized: StringToBooleanSchema.default(false),
  is_item_randomized: StringToBooleanSchema.default(false),
  score_per_item: z.coerce.number().min(1).max(1000).default(10),
  time_limit: z.coerce.number().min(30).max(600).default(60),
  categories: z.array(GroupSortCategorySchema).min(2).max(10),
});

export type ICreateGroupSort = z.infer<typeof CreateGroupSortSchema>;
