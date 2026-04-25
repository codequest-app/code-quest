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

export const EnvelopeSchema = z.discriminatedUnion('kind', [
  EventEnvelope,
  RequestEnvelope,
  ResponseEnvelope,
  PingEnvelope,
  PongEnvelope,
  ResumeEnvelope,
]);

export type Envelope = z.infer<typeof EnvelopeSchema>;
