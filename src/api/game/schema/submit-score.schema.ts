import { z } from 'zod';

export const SubmitScoreSchema = z.object({
  game_id: z.string().uuid('Invalid game ID format'),
  score: z.number().int().nonnegative('Score must be a non-negative number'),
  time_spent: z.number().int().nonnegative('Time spent must be non-negative').optional(),
  game_data: z.record(z.string(), z.any()).optional(),
});

export type ISubmitScore = z.infer<typeof SubmitScoreSchema>;
