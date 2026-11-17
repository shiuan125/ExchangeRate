/** 小數位數：日圓固定 4 位；國泰美金、英鎊 2 位；永豐美金 3 位、英鎊 4 位（照永豐牌告） */
export function rateDigits(currency, bank = 'cathay') {
  if (currency === 'JPY') return 4;
  if (bank !== 'sinopac') return 2;
  return currency === 'GBP' ? 4 : 3;
}

/**
 * 依幣別與銀行格式化匯率。
 * 先用指數字串做四捨五入，避開 toFixed 的浮點誤差（例如 1.005.toFixed(2) 會得到 1.00）。
 */
export function formatRate(value, currency, bank = 'cathay') {
  const digits = rateDigits(currency, bank);
  const rounded = Math.round(Number(`${value}e${digits}`)) / 10 ** digits;
  return rounded.toFixed(digits);
}
