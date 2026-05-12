import { z } from 'zod';

export const hookStartedInfoSchema: z.ZodObject<
  { hookName: z.ZodString; hookId: z.ZodString; hookEvent: z.ZodString },
  z.core.$strip
> = z.object({
  hookName: z.string(),
  hookId: z.string(),
  hookEvent: z.string(),
});
export type HookStartedInfo = z.infer<typeof hookStartedInfoSchema>;

export const hookResponseInfoSchema: z.ZodObject<
  {
    hookName: z.ZodString;
    hookId: z.ZodString;
    hookEvent: z.ZodString;
    hookEventName: z.ZodOptional<z.ZodString>;
    output: z.ZodOptional<z.ZodString>;
    additionalContext: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
> = z.object({
  hookName: z.string(),
  hookId: z.string(),
  hookEvent: z.string(),
  hookEventName: z.string().optional(),
  output: z.string().optional(),
  additionalContext: z.string().optional(),
});
export type HookResponseInfo = z.infer<typeof hookResponseInfoSchema>;

export const hookStartedPayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    hook: z.ZodObject<
      { hookName: z.ZodString; hookId: z.ZodString; hookEvent: z.ZodString },
      z.core.$strip
    >;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  hook: hookStartedInfoSchema,
});
export type HookStartedPayload = z.infer<typeof hookStartedPayloadSchema>;

export const hookResponsePayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    hook: z.ZodObject<
      {
        hookName: z.ZodString;
        hookId: z.ZodString;
        hookEvent: z.ZodString;
        hookEventName: z.ZodOptional<z.ZodString>;
        output: z.ZodOptional<z.ZodString>;
        additionalContext: z.ZodOptional<z.ZodString>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  hook: hookResponseInfoSchema,
});
export type HookResponsePayload = z.infer<typeof hookResponsePayloadSchema>;
