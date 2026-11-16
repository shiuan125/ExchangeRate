export const BANKS = ['cathay', 'sinopac'];

/** URL hash -> 銀行；只有 #sinopac 是永豐，其餘一律國泰 */
export function bankFromHash(hash) {
  return hash === '#sinopac' ? 'sinopac' : 'cathay';
}

/** 銀行 -> URL hash；國泰是預設頁，不帶 hash */
export function hashForBank(bank) {
  return bank === 'sinopac' ? '#sinopac' : '';
}
