#!/usr/bin/env node
/**
 * 測試 6: Worktree 整合
 *
 * 驗證項目：
 * - 在不同 worktree 目錄中啟動 Claude CLI 是否正常？
 * - 是否使用獨立的 git 狀態？
 * - .claude 配置是共享還是獨立？
 */

import * as pty from 'node-pty';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const LOG_FILE = path.join(process.cwd(), 'logs', '06-worktree.log');

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

async function setupTestWorktrees(): Promise<string[]> {
  log('=== 設置測試 Worktree ===\n');

  const mainDir = process.cwd();
  const worktreeBase = path.join(mainDir, '..', '.test-worktrees');

  // 清理舊的測試 worktree
  try {
    log('清理舊的測試 worktree...');
    execSync('git worktree list --porcelain | grep "^worktree.*test-wt-" | awk \'{print $2}\' | xargs -r git worktree remove --force', {
      cwd: mainDir,
      stdio: 'ignore'
    });
  } catch {
    // 忽略錯誤
  }

  const worktrees: string[] = [];

  try {
    // 創建測試 worktree
    for (let i = 1; i <= 2; i++) {
      const branchName = `test-wt-${i}-${Date.now()}`;
      const worktreePath = path.join(worktreeBase, `test-wt-${i}`);

      log(`創建 Worktree ${i}:`);
      log(`  Branch: ${branchName}`);
      log(`  Path: ${worktreePath}`);

      // 確保目錄不存在
      try {
        fs.rmSync(worktreePath, { recursive: true, force: true });
      } catch {
        // 忽略
      }

      // 創建 worktree
      execSync(`git worktree add "${worktreePath}" -b ${branchName}`, {
        cwd: mainDir,
        stdio: 'pipe'
      });

      worktrees.push(worktreePath);
      log(`  ✅ 創建成功\n`);
    }

    log(`✅ 所有測試 Worktree 已創建\n`);
    return worktrees;
  } catch (error: any) {
    log(`❌ 創建 Worktree 失敗: ${error.message}`);
    throw error;
  }
}

async function testInWorktree(worktreePath: string, index: number): Promise<string> {
  log(`\n--- 在 Worktree ${index} 中測試 ---`);
  log(`路徑: ${worktreePath}\n`);

  const claudePath = findClaudeCLI();
  const prompt = 'Show the current git branch name';

  return new Promise<string>((resolve, reject) => {
    const ptyProcess = pty.spawn(claudePath, ['-p', prompt], {
      name: 'xterm-256color',
      cols: 80,
      rows: 24,
      cwd: worktreePath, // 關鍵：在 worktree 目錄中執行
      env: {
        ...process.env,
        TERM: 'xterm-256color'
      }
    });

    let output = '';

    ptyProcess.onData((data) => {
      output += data;
      log(`[WT${index}] ${data.trim()}`);
    });

    ptyProcess.onExit(({ exitCode }) => {
      log(`\n[WT${index}] 完成 (exit ${exitCode})\n`);
      resolve(output);
    });

    // 超時保護
    setTimeout(() => {
      log(`\n[WT${index}] 超時`);
      ptyProcess.kill();
      reject(new Error('Timeout'));
    }, 60000);
  });
}

async function cleanupWorktrees(worktrees: string[]): Promise<void> {
  log('\n=== 清理測試 Worktree ===\n');

  const mainDir = process.cwd();

  for (const worktreePath of worktrees) {
    try {
      log(`移除: ${worktreePath}`);
      execSync(`git worktree remove "${worktreePath}" --force`, {
        cwd: mainDir,
        stdio: 'pipe'
      });
      log(`  ✅ 已移除`);
    } catch (error: any) {
      log(`  ⚠️ 移除失敗: ${error.message}`);
    }
  }

  log('\n✅ 清理完成\n');
}

async function test() {
  log('=== 測試 6: Worktree 整合 ===\n');

  let worktrees: string[] = [];

  try {
    // 設置測試 worktree
    worktrees = await setupTestWorktrees();

    // 在每個 worktree 中測試
    const outputs: string[] = [];

    for (let i = 0; i < worktrees.length; i++) {
      const output = await testInWorktree(worktrees[i], i + 1);
      outputs.push(output);
    }

    // 分析結果
    log('\n=== Worktree 隔離分析 ===\n');

    // 檢查是否顯示不同的 branch
    const branches = outputs.map((output, i) => {
      const branchMatch = output.match(/test-wt-\d+-\d+/);
      return branchMatch ? branchMatch[0] : null;
    });

    log('檢測到的 Branch:');
    branches.forEach((branch, i) => {
      log(`  Worktree ${i + 1}: ${branch || '未檢測到'}`);
    });

    let allDifferent = true;
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        if (branches[i] === branches[j]) {
          allDifferent = false;
          log(`⚠️ Worktree ${i + 1} 和 Worktree ${j + 1} 顯示相同的 branch`);
        }
      }
    }

    // 評估
    log('\n=== 評估 ===');

    if (allDifferent && branches.every(b => b !== null)) {
      log(`✅ Worktree 隔離正常（顯示不同的 branch）`);
    } else {
      log(`❌ Worktree 隔離異常`);
    }

    log(`\n=== 測試 6 完成 ===`);
    log(`詳細輸出已儲存至: ${LOG_FILE}`);

  } catch (error: any) {
    log(`\n❌ 測試失敗: ${error.message}`);
    throw error;
  } finally {
    // 清理
    if (worktrees.length > 0) {
      await cleanupWorktrees(worktrees);
    }
  }
}

test().then(() => {
  logStream.end();
  process.exit(0);
}).catch((error) => {
  log(`\n❌ 測試失敗: ${error.message}`);
  logStream.end();
  process.exit(1);
});
