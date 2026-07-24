import { parseBoardTime, minutesSince } from '../utils/boardTime';
import { isMarketOpen } from '../utils/market';

export function MarketStatus({ boardTime, fetching }) {
  const open = isMarketOpen();
  const parsed = boardTime ? parseBoardTime(boardTime) : null;
  const stale = open && parsed && minutesSince(parsed.ts) > 15;

  let statusClass = 'closed';
  let label = '盤後';
  if (fetching) {
    statusClass = 'live';
    label = '更新中';
  } else if (stale) {
    statusClass = 'stale';
    label = '資料延遲';
  } else if (open) {
    statusClass = 'live';
    label = '即時';
  }

  const timeLabel = parsed
    ? (open ? `報價時間 ${boardTime.slice(-8)}` : `最後報價 ${boardTime.slice(-8, -3)}`)
    : '';

  return (
    <div>
      <span className="status">
        <span className={`status-dot status-dot--${statusClass}`} />
        {label}
      </span>
      {timeLabel && <div className="board-time">{timeLabel}</div>}
    </div>
  );
}
