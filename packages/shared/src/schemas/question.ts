import { z } from 'zod';

export const questionOptionSchema = z.object({
  label: z.string(),
  description: z.string(),
});
export type QuestionOption = z.infer<typeof questionOptionSchema>;

export const questionSchema = z.object({
  question: z.string(),
  header: z.string(),
  options: z.array(questionOptionSchema),
  multiSelect: z.boolean(),
});
export type Question = z.infer<typeof questionSchema>;
