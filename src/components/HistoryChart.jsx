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

function ExtremeDot({
  cx, cy, stroke, board, label, isEdge,
}) {
  if (cx == null || cy == null) return null;
  // Y 軸只留資料極值 0.4% 的緩衝，最低點會非常靠近 X 軸，
  // 標籤一律往上放，才不會疊到下方的日期刻度文字
  const dy = -10;
  const textAnchor = isEdge === 'first' ? 'start' : isEdge === 'last' ? 'end' : 'middle';
  const dx = isEdge === 'first' ? 6 : isEdge === 'last' ? -6 : 0;
  return (
    <g>
      <circle cx={cx} cy={cy} r={3.5} fill={stroke} stroke={board} strokeWidth={1.5} />
      {/* 先畫一層背景色描邊當「暈開」底，避免線條穿過文字時互相遮蔽 */}
      <text
        x={cx + dx}
        y={cy + dy}
        textAnchor={textAnchor}
        fontSize={10}
        fontFamily="var(--font-num)"
        stroke={board}
        strokeWidth={3}
        strokeLinejoin="round"
        fill={stroke}
        paintOrder="stroke"
      >
        {label}
      </text>
    </g>
  );
}

function findExtremeIndexes(data, dataKey) {
  let maxIndex = -1;
  let minIndex = -1;
  let maxValue = -Infinity;
  let minValue = Infinity;
  data.forEach((row, i) => {
    const v = row[dataKey];
    if (v == null) return;
    if (v > maxValue) { maxValue = v; maxIndex = i; }
    if (v < minValue) { minValue = v; minIndex = i; }
  });
  return { maxIndex, minIndex };
}

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

  const buyExtremes = useMemo(() => findExtremeIndexes(data, 'buy'), [data]);
  const sellExtremes = useMemo(() => findExtremeIndexes(data, 'sell'), [data]);

  const renderExtremeDot = (extremes, stroke) => (props) => {
    const { index, value, key } = props;
    const isEdge = index === 0 ? 'first' : index === data.length - 1 ? 'last' : null;
    if (index === extremes.maxIndex) {
      return (
        <ExtremeDot
          key={key ?? `max-${index}`}
          {...props}
          stroke={stroke}
          board={colors.board}
          label={formatRate(value, currency)}
          isEdge={isEdge}
        />
      );
    }
    if (index === extremes.minIndex) {
      return (
        <ExtremeDot
          key={key ?? `min-${index}`}
          {...props}
          stroke={stroke}
          board={colors.board}
          label={formatRate(value, currency)}
          isEdge={isEdge}
        />
      );
    }
    return null;
  };

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
            <LineChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 8 }}>
              <CartesianGrid stroke={colors.rule} strokeDasharray="0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: colors.inkLight, fontFamily: 'var(--font-num)' }}
                tickLine={false}
                axisLine={{ stroke: colors.rule }}
                interval="preserveStartEnd"
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
              <Line
                type="monotone"
                dataKey="buy"
                stroke={colors.down}
                strokeWidth={1.75}
                dot={renderExtremeDot(buyExtremes, colors.down)}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="sell"
                stroke={colors.up}
                strokeWidth={1.75}
                dot={renderExtremeDot(sellExtremes, colors.up)}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
