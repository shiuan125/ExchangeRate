import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildChartData } from './chartData.js';

const rows = [
  { date: '2026-08-01', spotBuy: 1, spotSell: 2 },
  { date: '2026-11-13', spotBuy: 3, spotSell: 4 },
  { date: '2026-11-16', spotBuy: 5, spotSell: 6, cashBuy: 7, cashSell: 8 },
];

test('cash mode drops rows without cash', () => {
  assert.deepEqual(buildChartData(rows, 'cash', '2026-01-01'), [
    { date: '2026-11-16', buy: 7, sell: 8 },
  ]);
});

test('spot mode keeps rows', () => {
  assert.equal(buildChartData(rows, 'spot', '2026-01-01').length, 3);
});

test('cutoff filters older rows', () => {
  assert.deepEqual(buildChartData(rows, 'spot', '2026-11-01').map((r) => r.date), ['2026-11-13', '2026-11-16']);
});
