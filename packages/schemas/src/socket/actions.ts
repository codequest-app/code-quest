import { z } from 'zod';

// ── Actions ──

export const actionOpenUrlPayloadSchema: z.ZodObject<
  { channelId: z.ZodString; url: z.ZodString },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  url: z.string(),
});
export type ActionOpenUrlPayload = z.infer<typeof actionOpenUrlPayloadSchema>;

export const actionOpenFilePayloadSchema: z.ZodObject<
  {
    channelId: z.ZodString;
    filePath: z.ZodString;
    location: z.ZodOptional<
      z.ZodObject<
        {
          startLine: z.ZodOptional<z.ZodNumber>;
          endLine: z.ZodOptional<z.ZodNumber>;
          searchText: z.ZodOptional<z.ZodString>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
> = z.object({
  channelId: z.string(),
  filePath: z.string(),
  location: z
    .object({
      startLine: z.number().optional(),
      endLine: z.number().optional(),
      searchText: z.string().optional(),
    })
    .optional(),
});
export type ActionOpenFilePayload = z.infer<typeof actionOpenFilePayloadSchema>;
