#!/usr/bin/env node
/** Test runner: executes every tests/*.test.ts suite with Node's TypeScript stripping. */
import { readdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const testDir = resolve(here, '..', 'tests');
const files = readdirSync(testDir).filter((f) => f.endsWith('.test.ts')).sort();

console.log('\n============================================');
console.log(' SPACE MINER - AUTOMATED TEST SUITE');
console.log('============================================\n');

const { runAll } = await import(pathToFileURL(join(testDir, 'harness.ts')).href);
for (const file of files) {
  console.log(`[suite] ${file}`);
  await import(pathToFileURL(join(testDir, file)).href);
}
console.log('');
const { passed, failed, results } = await runAll();
console.log('\n--------------------------------------------');
console.log(` PASSED: ${passed}    FAILED: ${failed}    TOTAL: ${passed + failed}`);
console.log('--------------------------------------------\n');
if (failed > 0) {
  for (const r of results.filter((x) => !x.passed)) console.log(`FAILED: ${r.name}\n  ${r.error}`);
  process.exit(1);
}
