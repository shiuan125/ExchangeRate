import { useFlip } from '../hooks/useFlip';
import { useRateHistory } from '../hooks/useRateHistory';
import { formatRate } from '../utils/format';
import { computeRateBadge } from '../utils/rateBadge';

const NAMES = { USD: '美金', JPY: '日圓' };

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

function RateGroup({ label, buy, sell, currency, variant, rows }) {
  const buyBadge = computeRateBadge(rows, buy, `${variant}Buy`, 'high');
  const sellBadge = computeRateBadge(rows, sell, `${variant}Sell`, 'low');

  return (
    <div className="rate-group">
      <span className="eyebrow">{label}</span>
      <div className="rate-pair">
        <div>
          <span className="eyebrow">買入</span>
          <span className="rate-hint">銀行跟你買</span>
          <div><RateNumber value={buy} currency={currency} variant={variant} /></div>
          {buyBadge && <span className="rate-badge">{buyBadge}</span>}
        </div>
        <div>
          <span className="eyebrow">賣出</span>
          <span className="rate-hint">銀行賣給你</span>
          <div><RateNumber value={sell} currency={currency} variant={variant} /></div>
          {sellBadge && <span className="rate-badge">{sellBadge}</span>}
        </div>
      </div>
    </div>
  );
}

export function RateCard({ currency, spot, cash }) {
  const rows = useRateHistory(currency);

  return (
    <div className="card">
      <div className={`card-title card-title--${currency.toLowerCase()}`}>
        <span className="card-code">{currency}</span>
        <span className="card-name">{NAMES[currency]}</span>
      </div>
      <RateGroup label="即期" buy={spot.buy} sell={spot.sell} currency={currency} variant="spot" rows={rows} />
      <RateGroup label="現金" buy={cash.buy} sell={cash.sell} currency={currency} variant="cash" rows={rows} />
    </div>
  );
}
