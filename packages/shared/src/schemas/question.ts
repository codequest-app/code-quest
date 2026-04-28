import { z } from 'zod';

export const questionOptionSchema: z.ZodObject<
  { label: z.ZodString; description: z.ZodString },
  z.core.$strip
> = z.object({
  label: z.string(),
  description: z.string(),
});
export type QuestionOption = z.infer<typeof questionOptionSchema>;

export const questionSchema: z.ZodObject<
  {
    question: z.ZodString;
    header: z.ZodString;
    options: z.ZodArray<
      z.ZodObject<{ label: z.ZodString; description: z.ZodString }, z.core.$strip>
    >;
    multiSelect: z.ZodBoolean;
  },
  z.core.$strip
> = z.object({
  question: z.string(),
  header: z.string(),
  options: z.array(questionOptionSchema),
  multiSelect: z.boolean(),
});
export type Question = z.infer<typeof questionSchema>;
