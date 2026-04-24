import { useEffect, useRef } from 'react';
import { CandlestickSeries, ColorType, createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import type { Candle } from '../types';

interface Props {
  candles: Candle[];
  onReady: (chart: IChartApi, series: ISeriesApi<'Candlestick'>) => void;
}

export function ChartView({ candles, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;
    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: '#0f1420' }, textColor: '#d5def0' },
      grid: { vertLines: { color: '#20273a' }, horzLines: { color: '#20273a' } },
      crosshair: { mode: 0 },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#00c853',
      downColor: '#d50000',
      wickUpColor: '#00c853',
      wickDownColor: '#d50000',
      borderVisible: false,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    onReady(chart, series);

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [onReady]);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(candles.map((c) => ({ ...c, time: c.time as any })));
  }, [candles]);

  return <div className="chart-view" ref={containerRef} />;
}
