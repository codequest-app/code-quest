import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { createServer, type Server as HTTPServer } from 'http';
import type {
  HttpServer,
  HttpServerConfig,
  HealthResponse,
  TerminalListResponse,
  CreateTerminalRequest,
  CreateTerminalResponse,
  TerminalInfoResponse,
  ErrorResponse,
} from './types';

/**
 * HTTP server implementation using Express
 */
export class HttpServerImpl implements HttpServer {
  private readonly app: Express;
  private readonly config: HttpServerConfig;
  private httpServer: HTTPServer | null = null;
  private actualPort: number = 0;
  private readonly startTime: number;

  constructor(config: HttpServerConfig) {
    this.config = config;
    this.startTime = Date.now();
    this.app = express();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // CORS
    if (this.config.cors) {
      this.app.use(cors());
    }

    // Body parser
    this.app.use(express.json());

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/api/health', (req: Request, res: Response) => {
      const response: HealthResponse = {
        status: 'ok',
        uptime: Date.now() - this.startTime,
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    });

    // List all terminals
    this.app.get('/api/terminals', (req: Request, res: Response) => {
      const sessionIds = this.config.terminalManager.listSessions();
      const sessions = sessionIds
        .map((id) => {
          const session = this.config.terminalManager.getSession(id);
          if (!session) return null;
          return {
            id: session.id,
            pid: session.pid,
            isAlive: session.isAlive,
          };
        })
        .filter(Boolean);

      const response: TerminalListResponse = { sessions: sessions as any };
      res.json(response);
    });

    // Create new terminal
    this.app.post('/api/terminals', (req: Request, res: Response) => {
      try {
        const body = req.body as CreateTerminalRequest;

        // Validate request body
        if (body.cols !== undefined && typeof body.cols !== 'number') {
          const error: ErrorResponse = {
            error: 'BadRequest',
            message: 'cols must be a number',
          };
          return res.status(400).json(error);
        }

        if (body.rows !== undefined && typeof body.rows !== 'number') {
          const error: ErrorResponse = {
            error: 'BadRequest',
            message: 'rows must be a number',
          };
          return res.status(400).json(error);
        }

        // Create terminal session
        const session = this.config.terminalManager.createSession({
          shell: body.shell,
          cwd: body.cwd,
          cols: body.cols,
          rows: body.rows,
          args: body.args,
          env: body.env,
        });

        const response: CreateTerminalResponse = {
          id: session.id,
          pid: session.pid,
        };

        res.status(201).json(response);
      } catch (error) {
        const errorResponse: ErrorResponse = {
          error: 'InternalServerError',
          message: `Failed to create terminal: ${error instanceof Error ? error.message : String(error)}`,
        };
        res.status(500).json(errorResponse);
      }
    });

    // Get terminal info
    this.app.get('/api/terminals/:id', (req: Request, res: Response) => {
      const { id } = req.params;
      const session = this.config.terminalManager.getSession(id);

      if (!session) {
        const error: ErrorResponse = {
          error: 'NotFound',
          message: `Terminal not found: ${id}`,
        };
        return res.status(404).json(error);
      }

      const response: TerminalInfoResponse = {
        id: session.id,
        pid: session.pid,
        isAlive: session.isAlive,
      };

      res.json(response);
    });

    // Delete terminal
    this.app.delete('/api/terminals/:id', (req: Request, res: Response) => {
      const { id } = req.params;
      const removed = this.config.terminalManager.removeSession(id);

      if (!removed) {
        const error: ErrorResponse = {
          error: 'NotFound',
          message: `Terminal not found: ${id}`,
        };
        return res.status(404).json(error);
      }

      res.status(204).send();
    });
  }

  private setupErrorHandling(): void {
    // Handle JSON parsing errors
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err instanceof SyntaxError && 'body' in err) {
        const error: ErrorResponse = {
          error: 'BadRequest',
          message: 'Invalid JSON',
        };
        return res.status(400).json(error);
      }
      next(err);
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'NotFound',
        message: `Route not found: ${req.method} ${req.path}`,
      });
    });

    // Generic error handler
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', err);
      const error: ErrorResponse = {
        error: 'InternalServerError',
        message: err.message || 'Internal server error',
      };
      res.status(500).json(error);
    });
  }

  async start(): Promise<void> {
    if (this.httpServer) {
      throw new Error('Server is already running');
    }

    return new Promise((resolve, reject) => {
      try {
        this.httpServer = createServer(this.app);

        this.httpServer.listen(this.config.port, () => {
          const address = this.httpServer!.address();
          if (typeof address === 'object' && address) {
            this.actualPort = address.port;
          }
          console.log(`HTTP server listening on port ${this.actualPort}`);
          resolve();
        });

        this.httpServer.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    if (!this.httpServer) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.httpServer!.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('HTTP server stopped');
          this.httpServer = null;
          this.actualPort = 0;
          resolve();
        }
      });
    });
  }

  getPort(): number {
    return this.actualPort;
  }

  isRunning(): boolean {
    return this.httpServer !== null && this.actualPort > 0;
  }

  /**
   * Get the Express app instance (for testing)
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * Get the HTTP server instance (for Socket.io integration)
   */
  getHttpServer(): HTTPServer | null {
    return this.httpServer;
  }
}
