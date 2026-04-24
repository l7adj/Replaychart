import { useState } from 'react';
import type { SymbolName } from '../types';

interface Props {
  loading: boolean;
  onLoad: (symbol: SymbolName, startDate: string, depthDays: number) => Promise<void>;
}

export function PreloadScreen({ loading, onLoad }: Props) {
  const [symbol, setSymbol] = useState<SymbolName>('BTCUSDT');
  const [startDate, setStartDate] = useState(() => new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 16));
  const [depthDays, setDepthDays] = useState(7);

  return (
    <div className="preload-screen">
      <div className="preload-card">
        <h1>ReplayChart Pro</h1>
        <label>
          Market Selector
          <select value={symbol} onChange={(e) => setSymbol(e.target.value as SymbolName)}>
            <option>BTCUSDT</option>
            <option>ETHUSDT</option>
            <option>SOLUSDT</option>
            <option>BNBUSDT</option>
          </select>
        </label>

        <label>
          Replay Start Date
          <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>

        <label>
          Data Depth (days)
          <select value={depthDays} onChange={(e) => setDepthDays(Number(e.target.value))}>
            <option value={3}>3 أيام</option>
            <option value={7}>7 أيام</option>
            <option value={14}>14 يوم</option>
            <option value={30}>30 يوم</option>
          </select>
        </label>

        <button disabled={loading} onClick={() => onLoad(symbol, startDate, depthDays)}>
          {loading ? 'Loading...' : 'Load Chart'}
        </button>
      </div>
    </div>
  );
}
