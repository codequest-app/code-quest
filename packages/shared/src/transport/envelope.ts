import { z } from 'zod';

const EventEnvelope = z.object({
  kind: z.literal('event'),
  seq: z.number().int().nonnegative(),
  event: z.string(),
  data: z.unknown(),
});

const RequestEnvelope = z.object({
  kind: z.literal('request'),
  id: z.string(),
  event: z.string(),
  data: z.unknown(),
});

const ResponseEnvelope = z.object({
  kind: z.literal('response'),
  id: z.string(),
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

const PingEnvelope = z.object({ kind: z.literal('ping') });
const PongEnvelope = z.object({ kind: z.literal('pong') });

const ResumeEnvelope = z.object({
  kind: z.literal('resume'),
  lastSeq: z.number().int().nonnegative(),
});

export const EnvelopeSchema: z.ZodDiscriminatedUnion<
  [
    z.ZodObject<
      { kind: z.ZodLiteral<'event'>; seq: z.ZodNumber; event: z.ZodString; data: z.ZodUnknown },
      z.core.$strip
    >,
    z.ZodObject<
      { kind: z.ZodLiteral<'request'>; id: z.ZodString; event: z.ZodString; data: z.ZodUnknown },
      z.core.$strip
    >,
    z.ZodObject<
      {
        kind: z.ZodLiteral<'response'>;
        id: z.ZodString;
        ok: z.ZodBoolean;
        data: z.ZodOptional<z.ZodUnknown>;
        error: z.ZodOptional<z.ZodString>;
      },
      z.core.$strip
    >,
    z.ZodObject<{ kind: z.ZodLiteral<'ping'> }, z.core.$strip>,
    z.ZodObject<{ kind: z.ZodLiteral<'pong'> }, z.core.$strip>,
    z.ZodObject<{ kind: z.ZodLiteral<'resume'>; lastSeq: z.ZodNumber }, z.core.$strip>,
  ],
  'kind'
> = z.discriminatedUnion('kind', [
  EventEnvelope,
  RequestEnvelope,
  ResponseEnvelope,
  PingEnvelope,
  PongEnvelope,
  ResumeEnvelope,
]);

export type Envelope = z.infer<typeof EnvelopeSchema>;

export const PONG_JSON = '{"kind":"pong"}';

export function parseEnvelope(raw: string): Envelope | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || !('kind' in parsed)) return null;
  const result = EnvelopeSchema.safeParse(parsed);
  return result.success ? result.data : null;
}
