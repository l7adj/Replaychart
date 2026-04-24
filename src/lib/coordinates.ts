import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';

const isBusinessDay = (value: Time): value is { year: number; month: number; day: number } => {
  return typeof value === 'object' && value !== null && 'year' in value;
};

export const timeToUnix = (value: Time): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Math.floor(new Date(value).getTime() / 1000);
  if (isBusinessDay(value)) {
    return Math.floor(Date.UTC(value.year, value.month - 1, value.day) / 1000);
  }
  return Math.floor(Date.now() / 1000);
};

export const coordinateToDomain = (
  chart: IChartApi,
  series: ISeriesApi<'Candlestick'>,
  x: number,
  y: number,
): { time: number; price: number } | null => {
  const rawTime = chart.timeScale().coordinateToTime(x);
  const rawPrice = series.coordinateToPrice(y);
  if (rawTime === null || rawPrice === null) return null;
  return {
    time: timeToUnix(rawTime),
    price: rawPrice,
  };
};
