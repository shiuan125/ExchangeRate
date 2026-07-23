import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useHistory } from '../hooks/useHistory';
import { useChartColors } from '../hooks/useChartColors';
import { formatRate } from '../utils/format';

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-date num">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tooltip-row">
          <span className="eyebrow">{p.dataKey === 'buy' ? '買入' : '賣出'}</span>
          <span className="num">{formatRate(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

export function HistoryChart() {
  const [mode, setMode] = useState('spot');
  const [currency, setCurrency] = useState('USD');
  const { rows, loading } = useHistory(currency);
  const colors = useChartColors();

  const data = useMemo(() => rows.map((r) => ({
    date: r.date,
    buy: mode === 'spot' ? r.spotBuy : r.cashBuy,
    sell: mode === 'spot' ? r.spotSell : r.cashSell,
  })), [rows, mode]);

  return (
    <section>
      <h2 className="section-title">歷史走勢</h2>
      <div className="chart-controls">
        <div className="segment" role="group" aria-label="報價模式">
          <button type="button" aria-pressed={mode === 'spot'} onClick={() => setMode('spot')}>即期</button>
          <button type="button" aria-pressed={mode === 'cash'} onClick={() => setMode('cash')}>現金</button>
        </div>
        <div className="segment" role="group" aria-label="幣別">
          <button type="button" aria-pressed={currency === 'USD'} onClick={() => setCurrency('USD')}>USD</button>
          <button type="button" aria-pressed={currency === 'JPY'} onClick={() => setCurrency('JPY')}>JPY</button>
        </div>
      </div>

      {loading ? (
        <p className="empty-state">載入中…</p>
      ) : data.length < 2 ? (
        <div className="empty-state">
          <p>資料累積中</p>
          <p className="empty-state-sub">每個交易日自動記錄</p>
        </div>
      ) : (
        <div className="chart-wrap">
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
              <Line type="monotone" dataKey="buy" stroke={colors.down} strokeWidth={1.75} dot={false} />
              <Line type="monotone" dataKey="sell" stroke={colors.up} strokeWidth={1.75} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
