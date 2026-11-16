import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BANKS, bankFromHash, hashForBank } from './bank.js';

test('BANKS lists both banks', () => {
  assert.deepEqual(BANKS, ['cathay', 'sinopac']);
});

test('#sinopac maps to sinopac', () => {
  assert.equal(bankFromHash('#sinopac'), 'sinopac');
});

test('other hashes map to cathay', () => {
  for (const h of ['', '#', '#foo', '#SINOPAC', undefined]) {
    assert.equal(bankFromHash(h), 'cathay', `hash ${h}`);
  }
});

test('hashForBank', () => {
  assert.equal(hashForBank('sinopac'), '#sinopac');
  assert.equal(hashForBank('cathay'), '');
});

test('historyCollection', async () => {
  const { historyCollection } = await import('./bank.js');
  assert.equal(historyCollection('cathay'), 'rates');
  assert.equal(historyCollection('sinopac'), 'sinopac_rates');
  assert.equal(historyCollection('foo'), 'rates');
});
