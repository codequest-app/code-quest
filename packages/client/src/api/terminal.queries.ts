import { queryOptions } from '@tanstack/react-query';
import * as terminalService from '../services/terminal.ts';

export const terminalKeys = {
  all: ['terminals'] as const,
  lists: () => [...terminalKeys.all, 'list'] as const,
  detail: (id: string) => [...terminalKeys.all, 'detail', id] as const,
};

export const terminalQueries = {
  lists: () =>
    queryOptions({
      queryKey: terminalKeys.lists(),
      queryFn: terminalService.fetchTerminals,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: terminalKeys.detail(id),
      queryFn: () => terminalService.fetchTerminal(id),
      enabled: !!id,
    }),
};
