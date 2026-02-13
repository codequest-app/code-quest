#!/usr/bin/env node

/**
 * 測試 3: 事件解析能力
 *
 * 驗證項目：
 * - 能否捕獲 Tool use 事件？
 * - 能否獲取工具參數和結果？
 * - 能否捕獲 Token usage？
 * - 能否捕獲 Thinking blocks？
 * - 能否捕獲對話內容？
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as pty from 'node-pty';

const LOG_FILE = path.join(process.cwd(), 'logs', '03-event-parsing.log');

fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'w' });

function log(message: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  logStream.write(`${line}\n`);
}

function findClaudeCLI(): string {
  const possiblePaths = ['claude', path.join(process.env.HOME || '', '.claude/local/claude')];

  for (const p of possiblePaths) {
    try {
      execSync(`which ${p}`, { stdio: 'ignore' });
      return p;
    } catch {}
  }

  throw new Error('Claude CLI not found');
}

interface EventStats {
  toolUse: number;
  tokenUsage: number;
  thinking: number;
  dialogue: number;
  unknown: number;
  toolDetails: Array<{ tool: string; params: unknown }>;
}

async function test() {
  log('=== 測試 3: 事件解析能力 ===\n');

  const claudePath = findClaudeCLI();

  // 使用一個會調用多種工具的 prompt
  const prompt = 'Read the package.json file and tell me the project name';

  log(`測試 Prompt: ${prompt}`);
  log('\n開始執行...\n');

  return new Promise<void>((resolve) => {
    const ptyProcess = pty.spawn(claudePath, ['-p', prompt], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
      },
    });

    const stats: EventStats = {
      toolUse: 0,
      tokenUsage: 0,
      thinking: 0,
      dialogue: 0,
      unknown: 0,
      toolDetails: [],
    };

    let lineBuffer = '';

    ptyProcess.onData((data) => {
      lineBuffer += data;

      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() || '';

      lines.forEach((line) => {
        if (!line.trim()) return;

        // 嘗試解析為 JSON
        try {
          const event = JSON.parse(line);

          log(`\n📦 事件類型: ${event.type || 'unknown'}`);

          switch (event.type) {
            case 'tool_use':
            case 'tool_call':
              stats.toolUse++;
              log(`  🔧 工具: ${event.name || event.tool_name}`);

              if (event.input || event.parameters) {
                const params = event.input || event.parameters;
                log(`  📝 參數: ${JSON.stringify(params, null, 2)}`);

                stats.toolDetails.push({
                  tool: event.name || event.tool_name,
                  params,
                });
              }
              break;

            case 'tool_result':
              log(`  ✅ 工具結果`);
              if (event.content) {
                const preview = JSON.stringify(event.content).substring(0, 100);
                log(`  📄 內容預覽: ${preview}...`);
              }
              break;

            case 'usage':
            case 'token_usage':
              stats.tokenUsage++;
              log(`  💰 Token 使用:`);
              if (event.input_tokens !== undefined) {
                log(`    Input: ${event.input_tokens}`);
              }
              if (event.output_tokens !== undefined) {
                log(`    Output: ${event.output_tokens}`);
              }
              if (event.cache_read_input_tokens !== undefined) {
                log(`    Cache: ${event.cache_read_input_tokens}`);
              }
              break;

            case 'thinking':
            case 'thought':
              stats.thinking++;
              log(`  💭 Thinking block`);
              if (event.content || event.text) {
                const text = event.content || event.text;
                const preview = text.substring(0, 100);
                log(`    內容: ${preview}...`);
              }
              break;

            case 'text':
            case 'content':
            case 'message':
              stats.dialogue++;
              log(`  💬 對話內容`);
              if (event.text || event.content) {
                const text = event.text || event.content;
                log(`    ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
              }
              break;

            default:
              stats.unknown++;
              log(`  ❓ 未知類型: ${event.type}`);
              log(`    Keys: ${Object.keys(event).join(', ')}`);
          }
        } catch {
          // 非 JSON 行，可能是純文字輸出
          log(`\n💬 純文字: ${line.substring(0, 100)}`);
          stats.dialogue++;
        }
      });
    });

    ptyProcess.onExit(({ exitCode }) => {
      log(`\n\n=== 事件統計 ===`);
      log(`Exit code: ${exitCode}`);
      log(`Tool Use 事件: ${stats.toolUse}`);
      log(`Token Usage 事件: ${stats.tokenUsage}`);
      log(`Thinking 事件: ${stats.thinking}`);
      log(`對話事件: ${stats.dialogue}`);
      log(`未知事件: ${stats.unknown}`);

      log(`\n=== 工具調用詳情 ===`);
      stats.toolDetails.forEach((detail, i) => {
        log(`${i + 1}. ${detail.tool}`);
        log(`   參數: ${JSON.stringify(detail.params, null, 2)}`);
      });

      // 評估結果
      log(`\n=== 評估 ===`);

      if (stats.toolUse > 0) {
        log(`✅ 成功捕獲 Tool Use 事件`);
      } else {
        log(`❌ 未能捕獲 Tool Use 事件`);
      }

      if (stats.tokenUsage > 0) {
        log(`✅ 成功捕獲 Token Usage 事件`);
      } else {
        log(`⚠️ 未能捕獲 Token Usage 事件`);
      }

      if (stats.thinking > 0) {
        log(`✅ 成功捕獲 Thinking 事件`);
      } else {
        log(`ℹ️ 未捕獲 Thinking 事件（可能未啟用）`);
      }

      if (stats.dialogue > 0) {
        log(`✅ 成功捕獲對話內容`);
      } else {
        log(`❌ 未能捕獲對話內容`);
      }

      log(`\n=== 測試 3 完成 ===`);
      log(`詳細輸出已儲存至: ${LOG_FILE}`);

      logStream.end();
      resolve();
    });

    // 超時保護
    setTimeout(() => {
      log('\n⚠️ 測試超時 (90秒)');
      ptyProcess.kill();
    }, 90000);
  });
}

test()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log(`\n❌ 測試失敗: ${error.message}`);
    logStream.end();
    process.exit(1);
  });
