/** Minimal zero-dependency test harness (run with node --experimental-strip-types). */
export interface TestResult { name: string; passed: boolean; error?: string; }

const suites: { name: string; fn: () => void | Promise<void> }[] = [];
export const results: TestResult[] = [];

export function test(name: string, fn: () => void | Promise<void>): void {
  suites.push({ name, fn });
}

export function assert(cond: unknown, message: string): void {
  if (!cond) throw new Error(message);
}

export function assertEqual<T>(actual: T, expected: T, message = ''): void {
  if (actual !== expected) {
    throw new Error(`${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertClose(actual: number, expected: number, tolerance = 1e-6, message = ''): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`${message} — expected ~${expected} (±${tolerance}), got ${actual}`);
  }
}

export async function runAll(): Promise<{ passed: number; failed: number; results: TestResult[] }> {
  let passed = 0;
  let failed = 0;
  for (const suite of suites) {
    try {
      await suite.fn();
      results.push({ name: suite.name, passed: true });
      passed++;
      console.log(`  PASS  ${suite.name}`);
    } catch (err) {
      results.push({ name: suite.name, passed: false, error: String(err instanceof Error ? err.message : err) });
      failed++;
      console.log(`  FAIL  ${suite.name}`);
      console.log(`        ${err instanceof Error ? err.message : err}`);
    }
  }
  return { passed, failed, results };
}

/** In-memory Storage implementation so save/load can be tested headlessly. */
export class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number { return this.data.size; }
  clear(): void { this.data.clear(); }
  getItem(key: string): string | null { return this.data.get(key) ?? null; }
  key(index: number): string | null { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string): void { this.data.delete(key); }
  setItem(key: string, value: string): void { this.data.set(key, value); }
  [name: string]: any;
}
