/** 美金固定 2 位，日圓固定 4 位 */
export function formatRate(value, currency) {
  const digits = currency === 'JPY' ? 4 : 2;
  return value.toFixed(digits);
}
