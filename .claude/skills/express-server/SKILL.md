---
name: express-server
description: >
  Express server patterns with TypeScript, InversifyJS, and Socket.IO.
  Use when creating or modifying HTTP endpoints, middleware, route handlers,
  CORS config, graceful shutdown, or writing supertest integration tests.
---

# Express Server Skill

Stack: Express 4.x, TypeScript, ESM (`"type": "module"`), InversifyJS DI, Socket.IO, cors, helmet.
The server is a **thin HTTP layer** — business logic lives in injected services, not in route files.

---

## Project Structure

```
src/
  server/
    app.ts           # Express factory — creates and configures app, no listen()
    server.ts        # Entry point — binds port, handles SIGTERM
    routes/          # One file per resource, returns express.Router
    middleware/      # Custom middleware (auth, logging, validation)
    errors/          # AppError class, error handler middleware
```

---

## Middleware Ordering

Register in this exact order — order is critical:

```ts
app.use(helmet());                    // 1. Security headers — first
app.use(cors(corsOptions));           // 2. CORS — before body parsing
app.use(express.json({ limit: '1mb' })); // 3. Body parsers
app.use(rateLimiter);                 // 4. Rate limiting
app.use('/static', express.static(staticDir, { maxAge: '1d' })); // 5. Static
app.use('/health', healthRouter);     // 6. Health — no auth needed
app.use('/api', apiRouter);           // 7. App routes
app.use(errorHandler);                // 8. Error handler — always last
```

---

## Async Error Handling (Express 4)

Express 4 does not catch async errors automatically. Wrap handlers or use `express-async-errors`.

```ts
// Option A: wrapper (no extra dep)
const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Option B: import once in app.ts (patches express globally)
import 'express-async-errors';
```

Error middleware — must have exactly four parameters:

```ts
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const status = err instanceof AppError ? err.status : 500;
  const message = err instanceof AppError ? err.message : 'Internal Server Error';
  res.status(status).json({ error: message });
});
```

---

## Security

```ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

app.use(helmet());

const corsOptions: CorsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
  credentials: true,
};

const limiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use('/api', limiter);
```

Never use `origin: '*'` in production when `credentials: true`.

---

## Health Check

```ts
healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```

Kubernetes pattern: return `503` during shutdown to drain load balancer traffic before process exits.

---

## Graceful Shutdown

```ts
const httpServer = app.listen(port);

const shutdown = () => {
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref(); // force-kill after 10s
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

For Socket.IO: call `io.close()` inside `shutdown` before `httpServer.close()`.

---

## InversifyJS Integration

Resolve services from the container inside route factories — never `new`:

```ts
export function createApiRouter(container: Container): Router {
  const router = Router();
  const svc = container.get(MyService);
  router.get('/', asyncHandler(async (req, res) => {
    res.json(await svc.list());
  }));
  return router;
}
```

---

## Testing with Supertest

```ts
import request from 'supertest';
import { buildApp } from '../app.js';

const app = buildApp(testContainer);

it('GET /health returns 200', async () => {
  await request(app).get('/health').expect(200);
});
```

Bind a real or stub container — avoid mocking the HTTP layer itself.

---

## Common Pitfalls

- Forgetting `next(err)` in Express 4 async handlers causes silent hangs.
- Registering error middleware with three params — it silently becomes a regular middleware.
- Calling `app.listen()` inside the app factory breaks supertest (port conflicts).
- Setting `origin: '*'` with `credentials: true` is rejected by browsers.
- Static middleware before `helmet()` can serve files without security headers.
- Not calling `io.close()` on shutdown leaves Socket.IO connections hanging.

---

Sources:
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Health Checks and Graceful Shutdown](https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html)
- [Helmet.js](https://helmetjs.github.io/)
- [Rate Limiting in Express.js — Better Stack](https://betterstack.com/community/guides/scaling-nodejs/rate-limiting-express/)
- [Express Security Best Practices 2025 — Corgea](https://hub.corgea.com/articles/express-security-best-practices-2025)
