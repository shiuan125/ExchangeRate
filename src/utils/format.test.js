import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatRate, rateDigits } from './format.js';

test('國泰美金、英鎊 2 位，日圓 4 位', () => {
  assert.equal(formatRate(31.5, 'USD'), '31.50');
  assert.equal(formatRate(40.123, 'GBP', 'cathay'), '40.12');
  assert.equal(formatRate(0.2045, 'JPY', 'cathay'), '0.2045');
});

test('永豐美金 3 位，英鎊、日圓 4 位', () => {
  assert.equal(formatRate(31.565, 'USD', 'sinopac'), '31.565');
  assert.equal(formatRate(40.1, 'GBP', 'sinopac'), '40.1000');
  assert.equal(formatRate(40.12345, 'GBP', 'sinopac'), '40.1235');
  assert.equal(formatRate(0.20451, 'JPY', 'sinopac'), '0.2045');
  assert.equal(rateDigits('JPY', 'sinopac'), 4);
});

test('四捨五入不受浮點誤差影響', () => {
  assert.equal((1.005).toFixed(2), '1.00'); // toFixed 本身的誤差
  assert.equal(formatRate(1.005, 'USD'), '1.01');
  assert.equal(formatRate(31.5655, 'USD', 'sinopac'), '31.566');
});
