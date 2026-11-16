/** 單一幣別的買賣價：缺任一值回傳 null */
function pair(buy, sell) {
  const b = Number(buy);
  const s = Number(sell);
  return Number.isFinite(b) && Number.isFinite(s) && b > 0 && s > 0 ? { buy: b, sell: s } : null;
}

/**
 * 把 GAS 寫入的 sinopac/realtime 文件轉成與國泰即時資料相同的形狀
 * @param {object} d - { boardTime, usd, jpy, gbp? }，各幣別欄位 spotBuy/spotSell/cashBuy/cashSell
 */
export function mapSinopacRealtime(d) {
  const usdSpot = pair(d?.usd?.spotBuy, d?.usd?.spotSell);
  const usdCash = pair(d?.usd?.cashBuy, d?.usd?.cashSell);
  const jpySpot = pair(d?.jpy?.spotBuy, d?.jpy?.spotSell);
  const jpyCash = pair(d?.jpy?.cashBuy, d?.jpy?.cashSell);
  if (!usdSpot || !usdCash || !jpySpot || !jpyCash) throw new Error('永豐資料不完整');

  const gbpSpot = pair(d?.gbp?.spotBuy, d?.gbp?.spotSell);

  return {
    boardTime: d.boardTime,
    usd: { cash: usdCash, spot: usdSpot },
    jpy: { cash: jpyCash, spot: jpySpot },
    // 英鎊只有即期，沒有現金
    gbp: gbpSpot ? { spot: gbpSpot } : null,
    fetchedAt: new Date().toISOString(),
  };
}
