import { useLiveRate } from '../hooks/useLiveRate';
import { MarketStatus } from './MarketStatus';
import { RateCard } from './RateCard';
import { ThemeToggle } from './ThemeToggle';
import { ElderModeToggle } from './ElderModeToggle';
import { BankSwitch } from './BankSwitch';

export function LiveRatePanel({ bank = 'cathay', onBankChange }) {
  const { data, error, loading, fetching } = useLiveRate(bank);

  return (
    <section>
      <header className="header">
        <div className="header-left">
          <h1 className="page-title">匯率</h1>
          {onBankChange && <BankSwitch bank={bank} onChange={onBankChange} />}
        </div>
        <div className="header-right">
          {data && <MarketStatus boardTime={data.boardTime} fetching={fetching} />}
          <div className="header-controls">
            <ElderModeToggle />
            <ThemeToggle />
          </div>
        </div>
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
