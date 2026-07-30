import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useRateHistory } from '../hooks/useRateHistory';
import { useChartColors } from '../hooks/useChartColors';
import { formatRate } from '../utils/format';
import { dateKeyDaysAgo } from '../utils/date';

const RANGES = [
  { value: '7d', label: '7天', days: 7 },
  { value: '1m', label: '1月', days: 30 },
  { value: '3m', label: '3月', days: 90 },
  { value: '1y', label: '1年', days: 365 },
];

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  // 賣出排在買入上面，跟圖表線條與圖例順序一致
  const sorted = [...payload].sort((a) => (a.dataKey === 'sell' ? -1 : 1));
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date num">{label}</div>
      {sorted.map((p) => (
        <div key={p.dataKey} className="chart-tooltip-row">
          <span className="eyebrow" style={{ color: p.color }}>{p.dataKey === 'buy' ? '買入' : '賣出'}</span>
          <span className="num">{formatRate(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

export function HistoryChart() {
  const [mode, setMode] = useState('spot');
  const [currency, setCurrency] = useState('USD');
  const [range, setRange] = useState('1m');
  const { rows, loading } = useRateHistory(currency);
  const colors = useChartColors();
  const hasCash = currency !== 'GBP';

  const selectCurrency = (c) => {
    setCurrency(c);
    if (c === 'GBP') setMode('spot');
  };

  const data = useMemo(() => {
    const days = RANGES.find((r) => r.value === range)?.days ?? 30;
    const cutoff = dateKeyDaysAgo(days - 1);
    return rows
      .filter((r) => r.date >= cutoff)
      .map((r) => ({
        date: r.date,
        buy: mode === 'spot' ? r.spotBuy : r.cashBuy,
        sell: mode === 'spot' ? r.spotSell : r.cashSell,
      }));
  }, [rows, mode, range]);

  return (
    <section>
      <h2 className="section-title">歷史走勢</h2>
      <div className="chart-controls">
        <div className="segment" role="group" aria-label="報價模式">
          <button type="button" aria-pressed={mode === 'spot'} onClick={() => setMode('spot')}>即期</button>
          <button type="button" aria-pressed={mode === 'cash'} disabled={!hasCash} onClick={() => setMode('cash')}>現金</button>
        </div>
        <div className="segment" role="group" aria-label="幣別">
          <button type="button" aria-pressed={currency === 'USD'} onClick={() => selectCurrency('USD')}>USD</button>
          <button type="button" aria-pressed={currency === 'JPY'} onClick={() => selectCurrency('JPY')}>JPY</button>
          <button type="button" aria-pressed={currency === 'GBP'} onClick={() => selectCurrency('GBP')}>GBP</button>
        </div>
      </div>
      <div className="chart-controls chart-controls--range">
        <div className="segment" role="group" aria-label="時間範圍">
          {RANGES.map((r) => (
            <button key={r.value} type="button" aria-pressed={range === r.value} onClick={() => setRange(r.value)}>{r.label}</button>
          ))}
        </div>
      </div>

      <div className="chart-wrap">
        {loading ? (
          <p className="empty-state">載入中…</p>
        ) : data.length < 2 ? (
          <div className="empty-state">
            <p>資料累積中</p>
            <p className="empty-state-sub">每個交易日自動記錄</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid stroke={colors.rule} strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: colors.inkLight, fontFamily: 'var(--font-num)' }}
                tickLine={false}
                axisLine={{ stroke: colors.rule }}
                minTickGap={40}
                tickFormatter={(d) => d.slice(5).replace('-', '/')}
              />
              <YAxis
                domain={['dataMin - dataMin * 0.004', 'dataMax + dataMax * 0.004']}
                tick={{ fontSize: 11, fill: colors.inkLight, fontFamily: 'var(--font-num)' }}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(v) => v.toFixed(currency === 'JPY' ? 4 : 2)}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                payload={[
                  { value: '賣出', type: 'line', color: colors.up },
                  { value: '買入', type: 'line', color: colors.down },
                ]}
                formatter={(value) => <span style={{ color: colors.inkLight }}>{value}</span>}
              />
              <Line type="monotone" dataKey="buy" stroke={colors.down} strokeWidth={1.75} dot={false} />
              <Line type="monotone" dataKey="sell" stroke={colors.up} strokeWidth={1.75} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
