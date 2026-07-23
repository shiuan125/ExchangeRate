export default async function handler(req, res) {
  const url = process.env.RATE_API_URL;
  if (!url) return res.status(500).json({ error: 'RATE_API_URL not configured' });

  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    const d = await upstream.json();

    // Edge 快取 60 秒；上游失敗時回舊值最多 5 分鐘
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.status(200).json({
      boardTime: d.boardTime,
      usd: {
        cash: { buy: +d.usdcashbuyRate, sell: +d.usdcashsellRate },
        spot: { buy: +d.usddigitsbuyRate, sell: +d.usddigitssellRate },
      },
      jpy: {
        cash: { buy: +d.jpycashbuyRate, sell: +d.jpycashsellRate },
        spot: { buy: +d.jpydigitsbuyRate, sell: +d.jpydigitssellRate },
      },
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    res.status(502).json({ error: 'upstream failed', detail: String(e) });
  }
}
