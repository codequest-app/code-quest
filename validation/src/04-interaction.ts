#!/usr/bin/env node

/**
 * 測試 4: 互動模式處理
 *
 * 驗證項目：
 * - 能否識別用戶確認提示？
 * - 能否發送 y/n 回應？
 * - 能否處理 AskUserQuestion？
 * - Plan Mode 如何表現？
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as pty from 'node-pty';

const LOG_FILE = path.join(process.cwd(), 'logs', '04-interaction.log');

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

async function test() {
  log('=== 測試 4: 互動模式處理 ===\n');

  const claudePath = findClaudeCLI();

  // 使用一個不會真的執行危險操作的 prompt
  // 但會觸發確認提示（如果 Claude 決定這樣做）
  const prompt = 'List all files in the current directory';

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

    let fullOutput = '';
    let lineBuffer = '';
    let hasInteraction = false;

    ptyProcess.onData((data) => {
      fullOutput += data;
      lineBuffer += data;

      // 檢測常見的互動提示模式
      const interactionPatterns = [
        /\(y\/n\)/i,
        /\[y\/n\]/i,
        /yes\/no/i,
        /continue\?/i,
        /proceed\?/i,
        /are you sure\?/i,
        /confirm/i,
        /permission/i,
      ];

      const hasPrompt = interactionPatterns.some((pattern) => pattern.test(data));

      if (hasPrompt && !hasInteraction) {
        hasInteraction = true;
        log(`\n🔔 檢測到互動提示！`);
        log(`提示內容: ${data.substring(0, 200)}`);

        // 自動回應 'n' (不執行危險操作)
        log(`📤 發送回應: n`);
        ptyProcess.write('n\n');
      }

      // 檢測 Plan Mode 相關輸出
      if (data.includes('Plan Mode') || data.includes('PLAN MODE')) {
        log(`\n📋 檢測到 Plan Mode 相關內容`);
        log(`內容: ${data.substring(0, 200)}`);
      }

      // 檢測 AskUserQuestion
      if (data.includes('AskUserQuestion') || data.includes('question')) {
        log(`\n❓ 檢測到問題事件`);
        log(`內容: ${data.substring(0, 200)}`);
      }

      // 即時顯示部分輸出
      const lines = lineBuffer.split('\n');
      if (lines.length > 1) {
        lineBuffer = lines.pop() || '';
        lines.forEach((line) => {
          if (line.trim()) {
            log(`  ${line.substring(0, 150)}`);
          }
        });
      }
    });

    ptyProcess.onExit(({ exitCode }) => {
      log(`\n\n=== 互動模式評估 ===`);
      log(`Exit code: ${exitCode}`);

      if (hasInteraction) {
        log(`✅ 成功檢測到互動提示`);
        log(`✅ 成功發送回應`);
      } else {
        log(`ℹ️ 本次執行未觸發互動提示`);
        log(`   （這是正常的，因為測試 prompt 可能不需要確認）`);
      }

      // 檢查完整輸出中的互動模式
      log(`\n=== 完整輸出分析 ===`);

      const hasYesNo = /\(y\/n\)|\[y\/n\]|yes\/no/i.test(fullOutput);
      const hasPlanMode = /plan mode/i.test(fullOutput);
      const hasQuestion = /question|ask/i.test(fullOutput);

      if (hasYesNo) {
        log(`✅ 輸出包含 yes/no 提示`);
      }

      if (hasPlanMode) {
        log(`✅ 輸出包含 Plan Mode 相關內容`);
      }

      if (hasQuestion) {
        log(`✅ 輸出包含問題相關內容`);
      }

      log(`\n=== 測試 4 完成 ===`);
      log(`詳細輸出已儲存至: ${LOG_FILE}`);

      // 儲存完整輸出
      logStream.write('\n--- FULL OUTPUT ---\n');
      logStream.write(fullOutput);
      logStream.write('\n--- END OUTPUT ---\n');

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
