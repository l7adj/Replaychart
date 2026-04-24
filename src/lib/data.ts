import type { Candle, SymbolName } from '../types';

const ONE_MIN_MS = 60_000;

const makeSyntheticData = (fromMs: number, toMs: number, seed = 100): Candle[] => {
  let last = seed;
  const candles: Candle[] = [];
  for (let t = fromMs; t <= toMs; t += ONE_MIN_MS) {
    const i = candles.length;
    const drift = Math.sin(i / 30) * 0.2;
    const noise = (Math.random() - 0.5) * 1.8;
    const open = last;
    const close = Math.max(1, open + drift + noise);
    const high = Math.max(open, close) + Math.random() * 1.1;
    const low = Math.min(open, close) - Math.random() * 1.1;
    const volume = Math.random() * 350;
    last = close;
    candles.push({ time: Math.floor(t / 1000), open, high, low, close, volume });
  }
  return candles;
};

const fetchPaginatedKlines = async (symbol: SymbolName, fromMs: number, toMs: number): Promise<Candle[]> => {
  const all: Candle[] = [];
  let cursor = fromMs;
  const limit = 1000;

  while (cursor <= toMs) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=${limit}&startTime=${cursor}&endTime=${toMs}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Binance failed: ${response.status}`);
    const raw = (await response.json()) as [number, string, string, string, string, string, ...unknown[]][];
    if (!raw.length) break;

    const chunk = raw.map((item) => ({
      time: Math.floor(item[0] / 1000),
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
      volume: Number(item[5]),
    }));

    all.push(...chunk);
    const lastOpenMs = raw[raw.length - 1][0];
    const next = lastOpenMs + ONE_MIN_MS;
    if (next <= cursor) break;
    cursor = next;
  }

  return all.filter((c) => c.time * 1000 >= fromMs && c.time * 1000 <= toMs);
};

export const fetchBinance1mCandles = async (
  symbol: SymbolName,
  replayStartDate: string,
  depthDays: number,
): Promise<{ candles: Candle[]; source: 'binance' | 'synthetic'; replayStartTime: number }> => {
  const replayStartTimeMs = new Date(replayStartDate).getTime();
  if (Number.isNaN(replayStartTimeMs)) throw new Error('Invalid replay start date');

  const span = depthDays * 24 * 60 * ONE_MIN_MS;
  const fromMs = replayStartTimeMs - span;
  const toMs = replayStartTimeMs + span;

  try {
    const candles = await fetchPaginatedKlines(symbol, fromMs, toMs);
    if (!candles.length) throw new Error('No candles');
    return { candles, source: 'binance', replayStartTime: Math.floor(replayStartTimeMs / 1000) };
  } catch {
    const synthetic = makeSyntheticData(fromMs, toMs, symbol === 'BTCUSDT' ? 60000 : 2500);
    return { candles: synthetic, source: 'synthetic', replayStartTime: Math.floor(replayStartTimeMs / 1000) };
  }
};
