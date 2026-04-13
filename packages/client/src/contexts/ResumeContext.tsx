import { sessionResumeResponseSchema } from '@code-quest/shared';
import { createContext, type ReactNode, useContext } from 'react';
import { useSocket } from './SocketContext';

interface ResumeContextValue {
  resume: (sessionId: string) => Promise<{ channelId: string }>;
}

const ResumeContext = createContext<ResumeContextValue | null>(null);

export function useResume(): ResumeContextValue {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used within a ResumeProvider');
  return ctx;
}

export function ResumeProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();

  const resume = (sessionId: string): Promise<{ channelId: string }> =>
    new Promise((resolve, reject) => {
      socket.emit('session:resume', { sessionId }, (raw: unknown) => {
        const parsed = sessionResumeResponseSchema.safeParse(raw);
        if (!parsed.success) {
          reject(new Error('Invalid response'));
          return;
        }
        if (parsed.data.error) {
          reject(new Error(parsed.data.error));
          return;
        }
        if (!parsed.data.channelId) {
          reject(new Error('Invalid response'));
          return;
        }
        resolve({ channelId: parsed.data.channelId });
      });
    });

  return <ResumeContext.Provider value={{ resume }}>{children}</ResumeContext.Provider>;
}
