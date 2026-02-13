import { errorResponseSchema } from '@code-quest/shared';
import ky from 'ky';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

export const apiClient = ky.create({
  prefixUrl: serverUrl,
  hooks: {
    beforeError: [
      async (error) => {
        const { response } = error;
        if (response?.body) {
          try {
            const body = await response.json();
            const parsed = errorResponseSchema.safeParse(body);
            if (parsed.success) {
              error.message = parsed.data.message;
            }
          } catch {
            // ignore parse failures — keep original error
          }
        }
        return error;
      },
    ],
  },
});
