import { useEffect, useMemo, useState } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { useReplayStore } from '../lib/store';
import { aggregateCandles, DEFAULT_TIMEFRAMES, parseTimeframeToMinutes } from '../lib/timeframes';
import { ChartView } from './ChartView';
import { DrawingLayer } from './DrawingLayer';
import { MobileToolSheet } from './MobileToolSheet';
import { ObjectTree } from './ObjectTree';
import { PropertiesPanel } from './PropertiesPanel';
import { ReplayControls } from './ReplayControls';
import { Toolbar } from './Toolbar';

export function ChartWorkspace() {
  const [chart, setChart] = useState<IChartApi | null>(null);
  const [series, setSeries] = useState<ISeriesApi<'Candlestick'> | null>(null);
  const [mobilePanel, setMobilePanel] = useState<'tools' | 'objects' | 'replay' | 'properties' | null>(null);

  const symbol = useReplayStore((s) => s.symbol);
  const candles1m = useReplayStore((s) => s.candles1m);
  const timeframe = useReplayStore((s) => s.timeframe);
  const custom = useReplayStore((s) => s.customTimeframes);
  const replayIndex = useReplayStore((s) => s.replayIndex);
  const replayRunning = useReplayStore((s) => s.replayRunning);
  const replaySpeed = useReplayStore((s) => s.replaySpeed);
  const setTimeframe = useReplayStore((s) => s.setTimeframe);
  const addCustomTimeframe = useReplayStore((s) => s.addCustomTimeframe);
  const setReplayIndex = useReplayStore((s) => s.setReplayIndex);
  const setReplayBounds = useReplayStore((s) => s.setReplayBounds);
  const saveSession = useReplayStore((s) => s.saveSession);
  const drawings = useReplayStore((s) => s.drawings);

  const allFrames = [...DEFAULT_TIMEFRAMES, ...custom];
  const fullCandles = useMemo(() => aggregateCandles(candles1m, timeframe), [candles1m, timeframe]);
  const visibleCandles = useMemo(() => fullCandles.slice(0, replayIndex + 1), [fullCandles, replayIndex]);

  useEffect(() => {
    setReplayBounds(Math.max(0, fullCandles.length - 1), fullCandles);
  }, [fullCandles, setReplayBounds]);

  useEffect(() => {
    if (!replayRunning) return;
    const id = window.setInterval(() => {
      setReplayIndex(useReplayStore.getState().replayIndex + replaySpeed);
    }, Math.max(60, 700 / replaySpeed));
    return () => window.clearInterval(id);
  }, [replayRunning, replaySpeed, setReplayIndex]);

  useEffect(() => {
    saveSession();
  }, [timeframe, custom, replayIndex, replaySpeed, drawings, saveSession]);

  return (
    <div className="workspace">
      <header className="topbar">
        <strong>{symbol}</strong>
        <div className="timeframes">
          {allFrames.map((tf) => (
            <button key={tf} className={tf === timeframe ? 'active' : ''} onClick={() => setTimeframe(tf)}>
              {tf}
            </button>
          ))}
          <button
            onClick={() => {
              const candidate = prompt('Add timeframe: e.g. 7m, 3H, 2D');
              if (!candidate) return;
              try {
                parseTimeframeToMinutes(candidate);
                addCustomTimeframe(candidate);
              } catch {
                alert('Invalid timeframe format');
              }
            }}
          >
            +
          </button>
        </div>
      </header>

      <div className="workspace-main">
        <Toolbar />
        <section className="chart-center">
          <ChartView
            candles={visibleCandles}
            onReady={(c, s) => {
              setChart(c);
              setSeries(s);
            }}
          />
          <DrawingLayer chart={chart} series={series} />
        </section>
        <aside className="right-panel">
          <ObjectTree />
          <PropertiesPanel />
        </aside>
      </div>

      <div id="replay-controls-anchor">
        <ReplayControls max={Math.max(0, fullCandles.length - 1)} candlesForFrame={fullCandles} />
      </div>

      <nav className="mobile-nav">
        <button onClick={() => setMobilePanel('tools')}>Tools</button>
        <button onClick={() => setMobilePanel('objects')}>Objects</button>
        <button
          onClick={() => {
            setMobilePanel('replay');
            document.getElementById('replay-controls-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }}
        >
          Replay
        </button>
        <button onClick={() => setMobilePanel('properties')}>Properties</button>
      </nav>

      <MobileToolSheet open={mobilePanel === 'tools'} onClose={() => setMobilePanel(null)} />
      {mobilePanel === 'objects' && (
        <div className="mobile-sheet"><ObjectTree /></div>
      )}
      {mobilePanel === 'replay' && (
        <div className="mobile-sheet"><ReplayControls max={Math.max(0, fullCandles.length - 1)} candlesForFrame={fullCandles} /></div>
      )}
      {mobilePanel === 'properties' && (
        <div className="mobile-sheet"><PropertiesPanel /></div>
      )}
    </div>
  );
}
