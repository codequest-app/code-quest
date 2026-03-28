import type { AuthStatus } from '@code-quest/shared';
import express from 'express';
import request from 'supertest';
import { createProfileRouter } from '../routes/profile.ts';

describe('GET /api/profile', () => {
  it('returns auth status', async () => {
    const authStatus: AuthStatus = {
      authenticated: true,
      user: { name: 'Alice' },
      method: 'api_key',
    };
    const app = express();
    app.use(createProfileRouter(() => authStatus));

    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(authStatus);
  });

  it('returns unauthenticated status', async () => {
    const authStatus: AuthStatus = { authenticated: false };
    const app = express();
    app.use(createProfileRouter(() => authStatus));

    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(false);
  });

  it('returns 500 on error', async () => {
    const app = express();
    app.use(
      createProfileRouter(() => {
        throw new Error('auth broken');
      }),
    );

    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('auth broken');
  });
});
