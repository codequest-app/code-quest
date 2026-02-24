type EmitFn = (event: 'tavern:message', message: string, callback: (reply: string) => void) => void;

const DEFAULT_TIMEOUT = 10000;

export function createTavernChatHandler(
  emit: EmitFn | null,
  timeout = DEFAULT_TIMEOUT,
): ((message: string) => Promise<string>) | null {
  if (!emit) return null;

  return (message: string): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), timeout);
      emit('tavern:message', message, (reply: string) => {
        clearTimeout(timer);
        resolve(reply);
      });
    });
  };
}
