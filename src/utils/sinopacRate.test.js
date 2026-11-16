import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapSinopacRealtime } from './sinopacRate.js';

const full = () => ({
  boardTime: '2026/11/16 15:30:37',
  usd: { spotBuy: 32.885, spotSell: 32.99, cashBuy: 32.685, cashSell: 33.19 },
  jpy: { spotBuy: 0.2048, spotSell: 0.2085, cashBuy: 0.2018, cashSell: 0.21 },
  gbp: { spotBuy: 43.2792, spotSell: 43.7161 },
});

test('maps full doc', () => {
  const r = mapSinopacRealtime(full());
  assert.equal(r.boardTime, '2026/11/16 15:30:37');
  assert.deepEqual(r.usd.spot, { buy: 32.885, sell: 32.99 });
  assert.deepEqual(r.usd.cash, { buy: 32.685, sell: 33.19 });
  assert.deepEqual(r.jpy.spot, { buy: 0.2048, sell: 0.2085 });
  assert.deepEqual(r.jpy.cash, { buy: 0.2018, sell: 0.21 });
  assert.deepEqual(r.gbp, { spot: { buy: 43.2792, sell: 43.7161 } });
  assert.equal(typeof r.fetchedAt, 'string');
});

test('string numbers become numbers', () => {
  const d = full();
  d.usd.spotBuy = '32.8850';
  assert.equal(mapSinopacRealtime(d).usd.spot.buy, 32.885);
});

test('missing gbp gives null', () => {
  const d = full();
  delete d.gbp;
  assert.equal(mapSinopacRealtime(d).gbp, null);
});

test('missing usd throws', () => {
  const d = full();
  delete d.usd;
  assert.throws(() => mapSinopacRealtime(d), /永豐資料不完整/);
});

test('missing jpy throws', () => {
  const d = full();
  delete d.jpy;
  assert.throws(() => mapSinopacRealtime(d), /永豐資料不完整/);
});
