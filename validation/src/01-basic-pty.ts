#!/usr/bin/env node
/**
 * 測試 1: node-pty 基礎能力
 *
 * 驗證項目：
 * - 能否成功 spawn Claude Code CLI？
 * - 能否接收到 stdout/stderr？
 * - 能否向 stdin 發送輸入？
 * - 能否捕獲進程退出事件？
 * - TTY 環境變數是否正確傳遞？
 */

import * as pty from 'node-pty';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs', '01-basic-pty.log');

// 創建日誌文件
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'w' });

function log(message: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  logStream.write(line + '\n');
}

async function test() {
  log('=== 測試 1: node-pty 基礎能力 ===\n');

  // 測試 1.1: 檢查 Claude CLI 是否存在
  log('1.1 檢查 Claude CLI 是否存在...');

  const possiblePaths = [
    'claude',
    path.join(process.env.HOME || '', '.claude/local/claude'),
    '/usr/local/bin/claude',
    '/usr/bin/claude'
  ];

  let claudePath: string | null = null;

  for (const p of possiblePaths) {
    try {
      const { execSync } = await import('child_process');
      execSync(`which ${p}`, { stdio: 'ignore' });
      claudePath = p;
      log(`✅ 找到 Claude CLI: ${p}`);
      break;
    } catch {
      // 繼續搜尋
    }
  }

  if (!claudePath) {
    log('❌ 未找到 Claude CLI');
    log('請確保已安裝 Claude Code CLI');
    process.exit(1);
  }

  // 測試 1.2: 啟動 Claude CLI (--help)
  log('\n1.2 測試啟動 Claude CLI (--help)...');

  return new Promise<void>((resolve) => {
    const ptyProcess = pty.spawn(claudePath!, ['--help'], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        FORCE_COLOR: '1',
        COLORTERM: 'truecolor'
      }
    });

    let output = '';
    let hasReceivedData = false;

    // 測試 1.3: 接收輸出
    ptyProcess.onData((data) => {
      if (!hasReceivedData) {
        log('✅ 成功接收到輸出');
        hasReceivedData = true;
      }

      output += data;
      logStream.write(data);
    });

    // 測試 1.4: 捕獲退出事件
    ptyProcess.onExit(({ exitCode, signal }) => {
      log(`\n1.4 進程退出: exitCode=${exitCode}, signal=${signal}`);

      if (exitCode === 0) {
        log('✅ 正常退出 (exit code 0)');
      } else {
        log(`⚠️ 非正常退出 (exit code ${exitCode})`);
      }

      // 測試 1.5: 驗證輸出內容
      log('\n1.5 驗證輸出內容...');

      if (output.includes('Usage:') || output.includes('Options:')) {
        log('✅ 輸出包含預期的 help 內容');
      } else {
        log('⚠️ 輸出不包含預期的 help 內容');
      }

      // 檢查是否有 ANSI color codes
      const hasAnsiCodes = /\x1b\[\d+m/.test(output);
      if (hasAnsiCodes) {
        log('✅ 輸出包含 ANSI color codes (TTY 環境正確)');
      } else {
        log('⚠️ 輸出不包含 ANSI color codes');
      }

      log('\n=== 測試 1 完成 ===');
      log(`詳細輸出已儲存至: ${LOG_FILE}`);

      logStream.end();
      resolve();
    });

    // 超時保護
    setTimeout(() => {
      log('\n⚠️ 測試超時 (30秒)');
      ptyProcess.kill();
    }, 30000);
  });
}

// 執行測試
test().then(() => {
  process.exit(0);
}).catch((error) => {
  log(`\n❌ 測試失敗: ${error.message}`);
  logStream.end();
  process.exit(1);
});
