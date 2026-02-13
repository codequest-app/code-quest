import type { TerminalListResponse } from '@code-quest/shared';
import {
  createTerminalResponseSchema,
  terminalInfoResponseSchema,
  terminalListResponseSchema,
} from '@code-quest/shared';
import { apiClient } from '../api/api-client.ts';

export async function fetchTerminals(): Promise<TerminalListResponse> {
  const data = await apiClient.get('api/terminals').json();
  return terminalListResponseSchema.parse(data);
}

export async function fetchTerminal(id: string) {
  const data = await apiClient.get(`api/terminals/${id}`).json();
  return terminalInfoResponseSchema.parse(data);
}

export async function createTerminal(options?: Record<string, unknown>) {
  const data = await apiClient.post('api/terminals', { json: options }).json();
  return createTerminalResponseSchema.parse(data);
}

export async function deleteTerminal(id: string): Promise<void> {
  await apiClient.delete(`api/terminals/${id}`);
}
