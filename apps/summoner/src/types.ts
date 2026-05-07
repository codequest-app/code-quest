import type {
  ClientMessage,
  ProviderClientConfig,
  ResolvedControlResponse,
} from '@code-quest/shared';
import { z } from 'zod';

// --- Raw entry for recording ---

export const rawEventSchema: z.ZodObject<{
  timestamp: z.ZodNumber;
  sessionId: z.ZodString;
  direction: z.ZodEnum<{ in: 'in'; out: 'out'; err: 'err' }>;
  raw: z.ZodString;
  seq: z.ZodNumber;
}> = z.object({
  timestamp: z.number(),
  sessionId: z.string(),
  direction: z.enum(['in', 'out', 'err']),
  raw: z.string(),
  seq: z.number(),
});

export type RawEvent = z.infer<typeof rawEventSchema>;

// --- AdapterOutput: result of transforming a protocol message ---

export interface AdapterOutput {
  messages: ClientMessage[];
  controlResponses: ResolvedControlResponse[];
}

// --- ParseResult: generic parse output ---

interface ParseOk<E = unknown> {
  status: 'ok';
  raw: string;
  message: E;
}

interface ParseSkip {
  status: 'skip';
  raw: string;
  reason: string;
}

interface ParseUnknown {
  status: 'unknown';
  raw: string;
  type: string;
  data: unknown;
}

interface ParseError {
  status: 'error';
  raw: string;
  error: unknown;
}

export type ParseResult<E = unknown> = ParseOk<E> | ParseSkip | ParseUnknown | ParseError;

// --- ProviderAdapter: contract between ProcessRunner and CLI providers ---

export interface ProviderAdapter<E = unknown, L = unknown> {
  readonly command: string;
  readonly clientConfig: ProviderClientConfig;

  buildArgs(options?: L): string[];
  parseLine(line: string): ParseResult<E>;
  transform(message: E): AdapterOutput;
  formatMessage(text: string): string;
  formatRequest(
    event: string,
    payload: Record<string, unknown>,
  ): { subtype: string; input: Record<string, unknown> };
  formatControlRequest(
    subtype: string,
    input?: Record<string, unknown>,
    requestId?: string,
  ): string;
  formatControlResponse(requestId: string, response: Record<string, unknown>): string;
  mapResponse(event: string, response: Record<string, unknown>): Record<string, unknown>;
  extractRespondedRequestIds(
    parsedEvents: Array<{ direction: string; obj: Record<string, unknown> }>,
  ): Set<string>;
}
