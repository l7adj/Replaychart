import type { Candle } from '../types';

export const DEFAULT_TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1H', '2H', '4H', '1D'];

export const parseTimeframeToMinutes = (value: string): number => {
  const match = value.trim().match(/^(\d+)(m|H|D)$/i);
  if (!match) throw new Error(`Invalid timeframe: ${value}`);
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'm') return amount;
  if (unit === 'h') return amount * 60;
  return amount * 60 * 24;
};

export const aggregateCandles = (candles1m: Candle[], timeframe: string): Candle[] => {
  const minutes = parseTimeframeToMinutes(timeframe);
  if (minutes === 1) return candles1m;

  const bucketSec = minutes * 60;
  const buckets = new Map<number, Candle[]>();

  candles1m.forEach((candle) => {
    const bucketKey = Math.floor(candle.time / bucketSec) * bucketSec;
    const bucket = buckets.get(bucketKey);
    if (bucket) bucket.push(candle);
    else buckets.set(bucketKey, [candle]);
  });

  return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([time, group]) => ({
    time,
    open: group[0].open,
    high: Math.max(...group.map((g) => g.high)),
    low: Math.min(...group.map((g) => g.low)),
    close: group[group.length - 1].close,
    volume: group.reduce((sum, g) => sum + g.volume, 0),
  }));
};

export const findReplayIndexByStartTime = (candles: Candle[], replayStartTime: number): number => {
  if (!candles.length) return 0;
  const idx = candles.findIndex((c) => c.time >= replayStartTime);
  return idx === -1 ? candles.length - 1 : idx;
};
