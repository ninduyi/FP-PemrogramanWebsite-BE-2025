import { z } from 'zod';

export const CreateFindTheMatchItemSchema = z.object({
  question: z.string({
    required_error: 'Question is required',
  }),
  answer: z.string({
    required_error: 'Answer is required',
  }),
});

export const CreateFindTheMatchSchema = z.object({
  name: z
    .string({
      required_error: 'Game name is required',
    })
    .max(100, 'Name cannot be more than 100 characters'),
  description: z
    .string({
      required_error: 'Game description is required',
    })
    .max(2000, 'Description cannot be more than 2000 characters'),
  is_publish_immediately: z.boolean({
    required_error: 'Publish status is required',
  }),
  initial_lives: z
    .number()
    .min(1, 'Initial lives must be at least 1')
    .default(3),
  items: z
    .array(CreateFindTheMatchItemSchema)
    .min(1, 'At least one item (question-answer pair) is required'),
});

export type ICreateFindTheMatch = z.infer<typeof CreateFindTheMatchSchema>;
