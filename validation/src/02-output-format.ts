#!/usr/bin/env node
/**
 * 測試 2: Claude CLI 輸出格式
 *
 * 驗證項目：
 * - 輸出是什麼格式？（JSON lines / 純文字 / 混合）
 * - 是否支援 --format json 參數？
 * - 是否是 streaming 輸出？
 * - 是否包含 ANSI color codes？
 * - 是否有明確的事件分隔符？
 */

import * as pty from 'node-pty';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs', '02-output-format.log');

fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'w' });

function log(message: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  logStream.write(line + '\n');
}

function findClaudeCLI(): string {
  const possiblePaths = [
    'claude',
    path.join(process.env.HOME || '', '.claude/local/claude')
  ];

  const { execSync } = require('child_process');
  for (const p of possiblePaths) {
    try {
      execSync(`which ${p}`, { stdio: 'ignore' });
      return p;
    } catch {
      continue;
    }
  }

  throw new Error('Claude CLI not found');
}

interface TestConfig {
  name: string;
  args: string[];
  prompt: string;
}

async function testFormat(config: TestConfig): Promise<void> {
  log(`\n--- 測試: ${config.name} ---`);
  log(`參數: ${config.args.join(' ')}`);

  const claudePath = findClaudeCLI();
  const fullArgs = [...config.args, config.prompt];

  return new Promise<void>((resolve) => {
    const ptyProcess = pty.spawn(claudePath, fullArgs, {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        FORCE_COLOR: '1'
      }
    });

    let fullOutput = '';
    let lineBuffer = '';
    let lineCount = 0;
    let jsonLineCount = 0;
    let lastDataTime = Date.now();

    ptyProcess.onData((data) => {
      const now = Date.now();
      const timeSinceLastData = now - lastDataTime;
      lastDataTime = now;

      fullOutput += data;
      lineBuffer += data;

      // 檢查是否是 streaming（資料間隔很短）
      if (timeSinceLastData < 100) {
        log(`📊 Streaming 間隔: ${timeSinceLastData}ms`);
      }

      // 逐行分析
      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() || '';

      lines.forEach(line => {
        if (!line.trim()) return;

        lineCount++;
        log(`\n[Line ${lineCount}] ${line.substring(0, 200)}${line.length > 200 ? '...' : ''}`);

        // 嘗試解析為 JSON
        try {
          const json = JSON.parse(line);
          jsonLineCount++;
          log(`  ✅ Valid JSON: type="${json.type || 'unknown'}"`);

          // 記錄 JSON 結構
          const keys = Object.keys(json);
          log(`  📝 Keys: ${keys.join(', ')}`);
        } catch {
          log(`  ℹ️ Not JSON (可能是純文字輸出)`);
        }

        // 檢查 ANSI codes
        if (/\x1b\[\d+m/.test(line)) {
          log(`  🎨 包含 ANSI color codes`);
        }
      });
    });

    ptyProcess.onExit(({ exitCode }) => {
      log(`\n--- ${config.name} 完成 ---`);
      log(`Exit code: ${exitCode}`);
      log(`總行數: ${lineCount}`);
      log(`JSON 行數: ${jsonLineCount}`);
      log(`JSON 比例: ${lineCount > 0 ? (jsonLineCount / lineCount * 100).toFixed(1) : 0}%`);

      // 分析輸出格式
      if (jsonLineCount === lineCount && lineCount > 0) {
        log(`✅ 格式: 完全 JSON lines`);
      } else if (jsonLineCount > 0) {
        log(`⚠️ 格式: 混合 (JSON + 純文字)`);
      } else {
        log(`ℹ️ 格式: 純文字`);
      }

      // 儲存完整輸出到日誌
      log(`\n=== 完整原始輸出 ===`);
      logStream.write('\n--- RAW OUTPUT START ---\n');
      logStream.write(fullOutput);
      logStream.write('\n--- RAW OUTPUT END ---\n');

      resolve();
    });

    // 超時保護
    setTimeout(() => {
      log('\n⚠️ 測試超時 (60秒)');
      ptyProcess.kill();
    }, 60000);
  });
}

async function test() {
  log('=== 測試 2: Claude CLI 輸出格式 ===\n');

  const testConfigs: TestConfig[] = [
    {
      name: '預設格式',
      args: ['-p'],
      prompt: 'Say "Hello World"'
    },
    {
      name: '--print 模式',
      args: ['--print', '-p'],
      prompt: 'Say "Hello World"'
    },
    {
      name: '--streaming 模式',
      args: ['--streaming', '-p'],
      prompt: 'Say "Hello World"'
    }
  ];

  for (const config of testConfigs) {
    try {
      await testFormat(config);
    } catch (error: any) {
      log(`❌ 測試失敗: ${error.message}`);
    }
  }

  log('\n=== 測試 2 完成 ===');
  log(`詳細輸出已儲存至: ${LOG_FILE}`);
}

test().then(() => {
  logStream.end();
  process.exit(0);
}).catch((error) => {
  log(`\n❌ 測試失敗: ${error.message}`);
  logStream.end();
  process.exit(1);
});
