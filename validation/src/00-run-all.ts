#!/usr/bin/env node
/**
 * 執行所有驗證測試
 */

import { spawn } from 'node:child_process';
import * as path from 'node:path';

interface TestResult {
  name: string;
  exitCode: number;
  duration: number;
  success: boolean;
}

const tests = [
  { name: '01-basic-pty', file: '01-basic-pty.ts', description: 'node-pty 基礎能力' },
  { name: '02-output-format', file: '02-output-format.ts', description: 'Claude CLI 輸出格式' },
  { name: '03-event-parsing', file: '03-event-parsing.ts', description: '事件解析能力' },
  { name: '04-interaction', file: '04-interaction.ts', description: '互動模式處理' },
  { name: '05-parallel', file: '05-parallel.ts', description: '並行多進程' },
  { name: '06-worktree', file: '06-worktree.ts', description: 'Worktree 整合' },
];

async function runTest(test: (typeof tests)[0]): Promise<TestResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 執行測試: ${test.description}`);
  console.log(`   文件: ${test.file}`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  return new Promise((resolve) => {
    const proc = spawn('tsx', [path.join(__dirname, test.file)], {
      stdio: 'inherit',
      env: process.env,
    });

    proc.on('exit', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;

      resolve({
        name: test.name,
        exitCode: code || 0,
        duration,
        success,
      });
    });

    proc.on('error', (error) => {
      console.error(`❌ 執行測試時發生錯誤: ${error.message}`);
      const duration = Date.now() - startTime;
      resolve({
        name: test.name,
        exitCode: 1,
        duration,
        success: false,
      });
    });
  });
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log('🚀 Code Quest - node-pty 驗證測試套件');
  console.log('='.repeat(60));

  const results: TestResult[] = [];

  // 逐一執行測試
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);

    // 顯示單個測試結果
    console.log(`\n${result.success ? '✅' : '❌'} ${test.description}`);
    console.log(`   耗時: ${(result.duration / 1000).toFixed(2)}秒`);
  }

  // 總結
  console.log(`\n\n${'='.repeat(60)}`);
  console.log('📊 測試總結');
  console.log('='.repeat(60));

  const passedCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n總測試數: ${results.length}`);
  console.log(`✅ 通過: ${passedCount}`);
  console.log(`❌ 失敗: ${failedCount}`);
  console.log(`⏱️  總耗時: ${(totalDuration / 1000).toFixed(2)}秒`);

  console.log('\n詳細結果:');
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    console.log(`  ${status} ${tests[index].description} (${duration}秒)`);
  });

  console.log(`\n${'='.repeat(60)}`);

  if (failedCount === 0) {
    console.log('🎉 所有測試通過！');
    console.log('\n下一步: 查看 logs/ 目錄中的詳細日誌，分析驗證結果。');
    process.exit(0);
  } else {
    console.log('⚠️  部分測試失敗。');
    console.log('\n請檢查 logs/ 目錄中的日誌文件，查看失敗原因。');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(`\n❌ 執行測試套件時發生錯誤: ${error.message}`);
  process.exit(1);
});
