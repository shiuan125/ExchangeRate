import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRateBadge } from './rateBadge.js';
import { dateKeyDaysAgo } from './date.js';

/** 近 90 天每天都有即期，只有昨天有現鈔（模擬永豐回補後的第一天） */
function sinopacLikeRows() {
  const rows = [];
  for (let n = 89; n >= 1; n--) {
    const row = { date: dateKeyDaysAgo(n), spotBuy: 32 + n / 100, spotSell: 33 + n / 100 };
    if (n === 1) Object.assign(row, { cashBuy: 31.9, cashSell: 33.4 });
    rows.push(row);
  }
  return rows;
}

test('spot 90 days, cash only yesterday → cash badge null', () => {
  assert.equal(computeRateBadge(sinopacLikeRows(), 30, 'cashSell', 'low'), null);
  assert.equal(computeRateBadge(sinopacLikeRows(), 40, 'cashBuy', 'high'), null);
});

test('spot 90 days → lowest spotSell gives 近月最低', () => {
  assert.equal(computeRateBadge(sinopacLikeRows(), 30, 'spotSell', 'low'), '近月最低');
});

test('field never present → null', () => {
  assert.equal(computeRateBadge(sinopacLikeRows(), 30, 'noSuchField', 'low'), null);
});
