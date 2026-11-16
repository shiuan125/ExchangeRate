export const BANKS = ['cathay', 'sinopac'];

/** URL hash -> 銀行；只有 #sinopac 是永豐，其餘一律國泰 */
export function bankFromHash(hash) {
  return hash === '#sinopac' ? 'sinopac' : 'cathay';
}

/** 銀行 -> URL hash；國泰是預設頁，不帶 hash */
export function hashForBank(bank) {
  return bank === 'sinopac' ? '#sinopac' : '';
}

/** 銀行 -> 歷史收盤資料的 Firestore collection（格式相同：{CUR}_{YEAR} 文件，日期為 key） */
export function historyCollection(bank) {
  return bank === 'sinopac' ? 'sinopac_rates' : 'rates';
}
