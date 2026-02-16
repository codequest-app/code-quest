#!/usr/bin/env node
/**
 * Code Quest Server - Executable Entry Point
 * Starts the terminal management server with HTTP API and WebSocket support
 */

import { z } from 'zod';
import { createContainer, TYPES } from '../container.ts';
import type { Server, ServerConfig } from '../types.ts';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().min(1).default('localhost'),
});

async function main() {
  const env = envSchema.parse({ PORT: process.env.PORT, HOST: process.env.HOST });
  const port = env.PORT;
  const host = env.HOST;

  // Server configuration
  const config: ServerConfig = {
    port,
    host,
    cors: true,
  };

  // Create DI container and resolve server
  const container = createContainer();
  container.rebindSync<ServerConfig>(TYPES.ServerConfig).toConstantValue(config);
  const server = container.get<Server>(TYPES.Server);

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    try {
      await server.stop();
      console.log('Server stopped successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Start server
  try {
    await server.start();
    const status = server.getStatus();

    console.log('\n🚀 Code Quest Server Started');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 HTTP API:   http://${host}:${status.port}`);
    console.log(`🔌 WebSocket:  ws://${host}:${status.port}`);
    console.log(`💚 Health:     http://${host}:${status.port}/api/health`);
    if (process.env.MOCK_CLI === 'true') {
      console.log(`🎭 Mock CLI:   ENABLED (using mock scripts)`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\nPress Ctrl+C to stop\n');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
