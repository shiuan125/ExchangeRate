import { useLiveRate } from '../hooks/useLiveRate';
import { MarketStatus } from './MarketStatus';
import { RateCard } from './RateCard';
import { ThemeToggle } from './ThemeToggle';
import { ElderModeToggle } from './ElderModeToggle';

export function LiveRatePanel({ bank = 'cathay' }) {
  const { data, error, loading, fetching } = useLiveRate(bank);

  return (
    <section>
      <header className="header">
        {/* 第一列：標題置中、右側為大字／主題切換；第二列：盤況與報價時間靠右一行 */}
        <h1 className="page-title">匯率</h1>
        <div className="header-controls">
          <ElderModeToggle />
          <ThemeToggle />
        </div>
        {data && <MarketStatus boardTime={data.boardTime} fetching={fetching} />}
      </header>

      {loading && !data && <p className="empty-state">載入中…</p>}

      {error && !data && <p className="empty-state">匯率資料暫時無法取得，請稍後再試。</p>}

      {data && (
        <>
          {error && <p className="error-banner">目前顯示的是上一次成功取得的資料。</p>}
          <div className="rate-cards">
            <RateCard currency="USD" spot={data.usd.spot} cash={data.usd.cash} bank={bank} />
            <RateCard currency="JPY" spot={data.jpy.spot} cash={data.jpy.cash} bank={bank} />
            {data.gbp && <RateCard currency="GBP" spot={data.gbp.spot} bank={bank} />}
          </div>
        </>
      )}
    </section>
  );
}
