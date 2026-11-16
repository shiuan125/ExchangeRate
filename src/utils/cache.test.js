import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCachedLoader } from './cache.js';

function setup(ttlMs = 1000) {
  let clock = 0;
  const calls = [];
  const loader = createCachedLoader(async (key) => {
    calls.push(key);
    if (key === 'bad') throw new Error('boom');
    return `v:${key}`;
  }, ttlMs, () => clock);
  return { loader, calls, advance: (ms) => { clock += ms; } };
}

test('same key within ttl loads once, concurrent callers share', async () => {
  const { loader, calls } = setup();
  const [a, b] = await Promise.all([loader('x'), loader('x')]);
  assert.equal(a, 'v:x');
  assert.equal(b, 'v:x');
  assert.equal(await loader('x'), 'v:x');
  assert.deepEqual(calls, ['x']);
});

test('different keys load separately', async () => {
  const { loader, calls } = setup();
  await loader('x');
  await loader('y');
  assert.deepEqual(calls, ['x', 'y']);
});

test('reloads after ttl', async () => {
  const { loader, calls, advance } = setup(1000);
  await loader('x');
  advance(1001);
  await loader('x');
  assert.deepEqual(calls, ['x', 'x']);
});

test('failures are not cached', async () => {
  const { loader, calls } = setup();
  await assert.rejects(loader('bad'), /boom/);
  await assert.rejects(loader('bad'), /boom/);
  assert.deepEqual(calls, ['bad', 'bad']);
});
