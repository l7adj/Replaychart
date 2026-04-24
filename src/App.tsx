import { useState } from 'react';
import { fetchBinance1mCandles } from './lib/data';
import { useReplayStore } from './lib/store';
import { ChartWorkspace } from './components/ChartWorkspace';
import { PreloadScreen } from './components/PreloadScreen';
import type { SymbolName } from './types';

export default function App() {
  const [loading, setLoading] = useState(false);
  const isLoaded = useReplayStore((s) => s.isLoaded);
  const setLoadedData = useReplayStore((s) => s.setLoadedData);
  const loadSession = useReplayStore((s) => s.loadSession);

  const loadChart = async (symbol: SymbolName, startDate: string, depth: number) => {
    setLoading(true);
    loadSession();
    const { candles, source } = await fetchBinance1mCandles(symbol, startDate, depth);
    setLoadedData(symbol, candles, source);
    setLoading(false);
  };

  if (!isLoaded) {
    return <PreloadScreen loading={loading} onLoad={loadChart} />;
  }

  return <ChartWorkspace />;
}
