import { useFlip } from '../hooks/useFlip';
import { useRateHistory } from '../hooks/useRateHistory';
import { formatRate } from '../utils/format';
import { computeRateBadge } from '../utils/rateBadge';
import { taipeiToday } from '../utils/date';

const NAMES = { USD: '美金', JPY: '日圓', GBP: '英鎊' };

function RateNumber({ value, currency, variant }) {
  const formatted = formatRate(value, currency);
  const { display, prev, flipping } = useFlip(formatted);
  return (
    <span className={`rate-value rate-value--${variant} num${flipping ? ' is-flipping' : ''}`}>
      {flipping && <span className="flip-card flip-card--out" aria-hidden="true">{prev}</span>}
      <span className="flip-card flip-card--in">{display}</span>
    </span>
  );
}

/** 跟前次盤後收盤價比較：漲紅色向上箭頭、跌綠色向下箭頭，箭頭右邊標漲跌幅百分比 */
function ChangeArrow({ value, prev }) {
  if (typeof value !== 'number' || typeof prev !== 'number' || value === prev || prev === 0) return null;
  const up = value > prev;
  const percent = Math.abs((value - prev) / prev) * 100;
  return (
    <span className={`rate-change rate-change--${up ? 'up' : 'down'}`} aria-label={`較前次盤後${up ? '上漲' : '下跌'} ${percent.toFixed(2)}%`}>
      {up ? '▲' : '▼'} {percent.toFixed(2)}%
    </span>
  );
}

function RateGroup({ label, buy, sell, currency, variant, rows, prevRow }) {
  const buyBadge = computeRateBadge(rows, buy, `${variant}Buy`, 'high');
  const sellBadge = computeRateBadge(rows, sell, `${variant}Sell`, 'low');

  return (
    <div className="rate-group">
      <span className="eyebrow">{label}</span>
      <div className="rate-pair">
        <div>
          <span className="eyebrow">買入</span>
          <span className="rate-hint">銀行跟你買</span>
          <div>
            <RateNumber value={buy} currency={currency} variant={variant} />
            <ChangeArrow value={buy} prev={prevRow?.[`${variant}Buy`]} />
          </div>
          {buyBadge && <span className="rate-badge">{buyBadge}</span>}
        </div>
        <div>
          <span className="eyebrow">賣出</span>
          <span className="rate-hint">銀行賣給你</span>
          <div>
            <RateNumber value={sell} currency={currency} variant={variant} />
            <ChangeArrow value={sell} prev={prevRow?.[`${variant}Sell`]} />
          </div>
          {sellBadge && <span className="rate-badge">{sellBadge}</span>}
        </div>
      </div>
    </div>
  );
}

export function RateCard({ currency, spot, cash }) {
  const { rows } = useRateHistory(currency);
  // 前次盤後收盤價：排除今天（今天收盤同步後才會出現在 rows 裡）
  const today = taipeiToday();
  const prevRow = [...rows].reverse().find((r) => r.date < today);

  return (
    <div className="card">
      <div className={`card-title card-title--${currency.toLowerCase()}`}>
        <span className="card-code">{currency}</span>
        <span className="card-name">{NAMES[currency]}</span>
      </div>
      <RateGroup label="即期" buy={spot.buy} sell={spot.sell} currency={currency} variant="spot" rows={rows} prevRow={prevRow} />
      {cash && <RateGroup label="現金" buy={cash.buy} sell={cash.sell} currency={currency} variant="cash" rows={rows} prevRow={prevRow} />}
    </div>
  );
}
