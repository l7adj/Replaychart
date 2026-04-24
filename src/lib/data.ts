import type { Candle, SymbolName } from '../types';

const makeSyntheticData = (seed = 100, points = 3500): Candle[] => {
  const now = Math.floor(Date.now() / 1000);
  const start = now - points * 60;
  let last = seed;
  return Array.from({ length: points }, (_, i) => {
    const time = start + i * 60;
    const drift = Math.sin(i / 30) * 0.2;
    const noise = (Math.random() - 0.5) * 1.8;
    const open = last;
    const close = Math.max(1, open + drift + noise);
    const high = Math.max(open, close) + Math.random() * 1.1;
    const low = Math.min(open, close) - Math.random() * 1.1;
    const volume = Math.random() * 350;
    last = close;
    return { time, open, high, low, close, volume };
  });
};

export const fetchBinance1mCandles = async (
  symbol: SymbolName,
  startDate: string,
  depth: number,
): Promise<{ candles: Candle[]; source: 'binance' | 'synthetic' }> => {
  try {
    const startTime = new Date(startDate).getTime();
    if (Number.isNaN(startTime)) {
      throw new Error('Invalid start date');
    }
    const limit = Math.min(1000, Math.max(100, depth));
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=${limit}&startTime=${startTime}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Binance failed: ${response.status}`);
    }
    const raw = (await response.json()) as [
      number,
      string,
      string,
      string,
      string,
      string,
      ...unknown[]
    ][];

    const candles: Candle[] = raw.map((item) => ({
      time: Math.floor(item[0] / 1000),
      open: Number(item[1]),
      high: Number(item[2]),
      low: Number(item[3]),
      close: Number(item[4]),
      volume: Number(item[5]),
    }));

    if (!candles.length) {
      throw new Error('No candles');
    }
    return { candles, source: 'binance' };
  } catch {
    const synthetic = makeSyntheticData(symbol === 'BTCUSDT' ? 60000 : 2500, depth);
    return { candles: synthetic, source: 'synthetic' };
  }
};
