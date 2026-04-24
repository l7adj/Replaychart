import { useEffect, useState } from 'react';
import { fetchBinance1mCandles } from './lib/data';
import { useReplayStore } from './lib/store';
import { loadChartCache, saveChartCache } from './lib/chartCache';
import { ChartWorkspace } from './components/ChartWorkspace';
import { PreloadScreen } from './components/PreloadScreen';
import type { SymbolName } from './types';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const isLoaded = useReplayStore((s) => s.isLoaded);
  const setLoadedData = useReplayStore((s) => s.setLoadedData);
  const loadSession = useReplayStore((s) => s.loadSession);

  useEffect(() => {
    let cancelled = false;

    const restoreCachedChart = async () => {
      loadSession();
      try {
        const cached = await loadChartCache();
        if (!cancelled && cached?.candles.length) {
          setLoadedData(cached.symbol, cached.candles, cached.source, cached.replayStartTime);
        }
      } catch {
        // If the browser blocks IndexedDB or the cache is corrupted, fall back to manual loading.
      } finally {
        if (!cancelled) setRestoring(false);
      }
    };

    restoreCachedChart();

    return () => {
      cancelled = true;
    };
  }, [loadSession, setLoadedData]);

  const loadChart = async (symbol: SymbolName, startDate: string, depthDays: number) => {
    setLoading(true);
    loadSession();
    try {
      const { candles, source, replayStartTime } = await fetchBinance1mCandles(symbol, startDate, depthDays);
      setLoadedData(symbol, candles, source, replayStartTime);
      await saveChartCache({ version: 1, savedAt: Date.now(), symbol, candles, source, replayStartTime });
    } finally {
      setLoading(false);
    }
  };

  if (restoring) {
    return (
      <div className="preload-screen">
        <div className="preload-card">
          <h1>ReplayChart Pro</h1>
          <p>Restoring last chart...</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <PreloadScreen loading={loading} onLoad={loadChart} />;
  }

  return <ChartWorkspace />;
}
