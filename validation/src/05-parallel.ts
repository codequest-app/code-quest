#!/usr/bin/env node
/**
 * 測試 5: 並行多進程
 *
 * 驗證項目：
 * - 能否同時啟動多個 Claude CLI 進程？
 * - 進程之間是否真的獨立？
 * - Session 是否隔離？
 * - 資源使用情況如何？
 */

import * as pty from 'node-pty';
import * as fs from 'fs';
import * as path from 'path';

const LOG_FILE = path.join(process.cwd(), 'logs', '05-parallel.log');

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

interface ProcessInfo {
  id: number;
  pty: pty.IPty;
  output: string;
  startTime: number;
  endTime?: number;
  exitCode?: number;
}

async function test() {
  log('=== 測試 5: 並行多進程 ===\n');

  const claudePath = findClaudeCLI();
  const processCount = 3;

  // 為每個進程設計不同的簡單任務
  const tasks = [
    'Say "Process 1 reporting"',
    'Say "Process 2 reporting"',
    'Say "Process 3 reporting"'
  ];

  log(`準備啟動 ${processCount} 個並行進程...\n`);

  const processes: ProcessInfo[] = [];
  const startMemory = process.memoryUsage();

  log(`初始記憶體使用:`);
  log(`  RSS: ${(startMemory.rss / 1024 / 1024).toFixed(2)} MB`);
  log(`  Heap: ${(startMemory.heapUsed / 1024 / 1024).toFixed(2)} MB\n`);

  // 同時啟動所有進程
  const startTime = Date.now();

  for (let i = 0; i < processCount; i++) {
    const prompt = tasks[i];

    log(`[Process ${i + 1}] 啟動中...`);
    log(`  任務: ${prompt}`);

    const processInfo: ProcessInfo = {
      id: i + 1,
      pty: null as any,
      output: '',
      startTime: Date.now()
    };

    const ptyProcess = pty.spawn(claudePath, ['-p', prompt], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color'
      }
    });

    processInfo.pty = ptyProcess;

    ptyProcess.onData((data) => {
      processInfo.output += data;
      // 即時記錄輸出
      log(`[Process ${i + 1}] ${data.trim().substring(0, 100)}`);
    });

    ptyProcess.onExit(({ exitCode }) => {
      processInfo.endTime = Date.now();
      processInfo.exitCode = exitCode;

      const duration = processInfo.endTime - processInfo.startTime;
      log(`\n[Process ${i + 1}] 完成`);
      log(`  Exit code: ${exitCode}`);
      log(`  執行時間: ${(duration / 1000).toFixed(2)}秒`);
      log(`  輸出長度: ${processInfo.output.length} 字元\n`);
    });

    processes.push(processInfo);

    // 略微延遲避免同時啟動造成問題
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  log(`\n✅ 所有 ${processCount} 個進程已啟動\n`);

  // 等待所有進程完成
  return new Promise<void>((resolve) => {
    const checkInterval = setInterval(() => {
      const allFinished = processes.every(p => p.endTime !== undefined);

      if (allFinished) {
        clearInterval(checkInterval);

        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        const endMemory = process.memoryUsage();

        log(`\n=== 並行測試統計 ===`);
        log(`總執行時間: ${(totalDuration / 1000).toFixed(2)}秒`);

        log(`\n各進程執行時間:`);
        processes.forEach(p => {
          const duration = (p.endTime! - p.startTime) / 1000;
          log(`  Process ${p.id}: ${duration.toFixed(2)}秒 (exit ${p.exitCode})`);
        });

        const avgDuration = processes.reduce((sum, p) => sum + (p.endTime! - p.startTime), 0) / processes.length / 1000;
        log(`\n平均執行時間: ${avgDuration.toFixed(2)}秒`);

        // 記憶體使用
        log(`\n記憶體使用變化:`);
        log(`  RSS: ${(startMemory.rss / 1024 / 1024).toFixed(2)} MB → ${(endMemory.rss / 1024 / 1024).toFixed(2)} MB`);
        log(`  Heap: ${(startMemory.heapUsed / 1024 / 1024).toFixed(2)} MB → ${(endMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`);

        const rssDiff = (endMemory.rss - startMemory.rss) / 1024 / 1024;
        const heapDiff = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;

        log(`\n記憶體增長:`);
        log(`  RSS: ${rssDiff > 0 ? '+' : ''}${rssDiff.toFixed(2)} MB`);
        log(`  Heap: ${heapDiff > 0 ? '+' : ''}${heapDiff.toFixed(2)} MB`);

        // 檢查輸出隔離
        log(`\n=== 輸出隔離檢查 ===`);
        const outputs = processes.map(p => p.output);

        let hasConflict = false;
        for (let i = 0; i < outputs.length; i++) {
          for (let j = i + 1; j < outputs.length; j++) {
            if (outputs[i] === outputs[j] && outputs[i].length > 0) {
              log(`⚠️ Process ${i + 1} 和 Process ${j + 1} 輸出相同！`);
              hasConflict = true;
            }
          }
        }

        if (!hasConflict) {
          log(`✅ 所有進程輸出獨立（無混淆）`);
        }

        // 評估
        log(`\n=== 評估 ===`);

        const allSuccess = processes.every(p => p.exitCode === 0);
        if (allSuccess) {
          log(`✅ 所有進程成功執行`);
        } else {
          log(`⚠️ 部分進程失敗`);
        }

        if (!hasConflict) {
          log(`✅ 進程之間獨立運行（輸出隔離）`);
        }

        if (rssDiff < 500) { // 增長小於 500MB
          log(`✅ 記憶體使用合理`);
        } else {
          log(`⚠️ 記憶體使用較高`);
        }

        log(`\n=== 測試 5 完成 ===`);
        log(`詳細輸出已儲存至: ${LOG_FILE}`);

        logStream.end();
        resolve();
      }
    }, 500);

    // 超時保護
    setTimeout(() => {
      clearInterval(checkInterval);
      log('\n⚠️ 測試超時 (120秒)');
      processes.forEach(p => {
        if (!p.endTime) {
          p.pty.kill();
        }
      });
      logStream.end();
      resolve();
    }, 120000);
  });
}

test().then(() => {
  process.exit(0);
}).catch((error) => {
  log(`\n❌ 測試失敗: ${error.message}`);
  logStream.end();
  process.exit(1);
});
