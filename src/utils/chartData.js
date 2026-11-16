/**
 * 走勢圖資料：只保留 cutoff 之後、且該模式買賣價都有值的日子。
 * 永豐現鈔沒有回補，缺值的日子要濾掉，否則圖會斷線而不是顯示「資料累積中」。
 * @param {Array<{date: string}>} rows 依日期由舊到新排序的歷史資料
 * @param {'spot' | 'cash'} mode
 * @param {string} cutoff YYYY-MM-DD
 */
export function buildChartData(rows, mode, cutoff) {
  return rows
    .filter((r) => r.date >= cutoff)
    .map((r) => ({
      date: r.date,
      buy: mode === 'spot' ? r.spotBuy : r.cashBuy,
      sell: mode === 'spot' ? r.spotSell : r.cashSell,
    }))
    .filter((r) => typeof r.buy === 'number' && typeof r.sell === 'number');
}
