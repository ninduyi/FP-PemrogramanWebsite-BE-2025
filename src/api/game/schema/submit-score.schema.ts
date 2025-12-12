import z from 'zod';

export const SubmitScoreSchema = z.object({
  game_id: z.string().uuid(),
  score: z.number().int().min(0),
  time_spent: z.number().int().min(0).optional(),
  game_data: z.record(z.any()).optional(),
});

export type ISubmitScore = z.infer<typeof SubmitScoreSchema>;
