import { useLiveRate } from '../hooks/useLiveRate';
import { MarketStatus } from './MarketStatus';
import { RateCard } from './RateCard';
import { ThemeToggle } from './ThemeToggle';

export function LiveRatePanel() {
  const { data, error, loading } = useLiveRate();

  return (
    <section>
      <header className="header">
        <h1 className="page-title">匯率</h1>
        <div className="header-right">
          {data && <MarketStatus boardTime={data.boardTime} />}
          <ThemeToggle />
        </div>
      </header>

      {loading && !data && <p className="empty-state">載入中…</p>}

      {error && !data && <p className="empty-state">匯率資料暫時無法取得，請稍後再試。</p>}

      {data && (
        <>
          {error && <p className="error-banner">目前顯示的是上一次成功取得的資料。</p>}
          <div className="rate-cards">
            <RateCard currency="USD" spot={data.usd.spot} cash={data.usd.cash} />
            <RateCard currency="JPY" spot={data.jpy.spot} cash={data.jpy.cash} />
          </div>
        </>
      )}
    </section>
  );
}
