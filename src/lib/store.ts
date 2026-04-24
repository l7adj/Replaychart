import { create } from 'zustand';
import { findReplayIndexByStartTime, DEFAULT_TIMEFRAMES } from './timeframes';
import type { Candle, DrawingObject, SessionState, SymbolName, ToolType } from '../types';

const STORAGE_KEY = 'replaychart-pro-session-v1';

interface ReplayStore extends SessionState {
  candles1m: Candle[];
  isLoaded: boolean;
  dataSource: 'binance' | 'synthetic' | null;
  activeTool: ToolType;
  selectedDrawingId: string | null;
  replayRunning: boolean;
  maxReplayIndex: number;
  setLoadedData: (
    symbol: SymbolName,
    candles: Candle[],
    source: 'binance' | 'synthetic',
    replayStartTime: number,
  ) => void;
  setTimeframe: (timeframe: string) => void;
  addCustomTimeframe: (timeframe: string) => void;
  setActiveTool: (tool: ToolType) => void;
  addDrawing: (drawing: DrawingObject) => void;
  updateDrawing: (id: string, patch: Partial<DrawingObject>) => void;
  removeDrawing: (id: string) => void;
  setSelectedDrawing: (id: string | null) => void;
  setReplayIndex: (index: number) => void;
  setReplayBounds: (maxIndex: number, candlesForFrame: Candle[]) => void;
  setReplayRunning: (running: boolean) => void;
  setReplaySpeed: (speed: number) => void;
  resetReplayStart: (candlesForFrame: Candle[]) => void;
  saveSession: () => void;
  loadSession: () => void;
}

const defaults: SessionState = {
  symbol: 'BTCUSDT',
  timeframe: '1m',
  customTimeframes: [],
  drawings: [],
  replayIndex: 0,
  replaySpeed: 1,
  replayStartTime: 0,
};

export const useReplayStore = create<ReplayStore>((set, get) => ({
  ...defaults,
  candles1m: [],
  isLoaded: false,
  dataSource: null,
  activeTool: 'cursor',
  selectedDrawingId: null,
  replayRunning: false,
  maxReplayIndex: 0,
  setLoadedData: (symbol, candles, source, replayStartTime) =>
    set(() => ({
      symbol,
      candles1m: candles,
      isLoaded: true,
      dataSource: source,
      replayStartTime,
      replayIndex: findReplayIndexByStartTime(candles, replayStartTime),
      maxReplayIndex: Math.max(0, candles.length - 1),
    })),
  setTimeframe: (timeframe) => set({ timeframe }),
  addCustomTimeframe: (timeframe) =>
    set((state) => {
      if (DEFAULT_TIMEFRAMES.includes(timeframe) || state.customTimeframes.includes(timeframe)) return state;
      return { customTimeframes: [...state.customTimeframes, timeframe], timeframe };
    }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  addDrawing: (drawing) => set((state) => ({ drawings: [...state.drawings, drawing] })),
  updateDrawing: (id, patch) =>
    set((state) => ({ drawings: state.drawings.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  removeDrawing: (id) =>
    set((state) => ({
      drawings: state.drawings.filter((d) => d.id !== id),
      selectedDrawingId: state.selectedDrawingId === id ? null : state.selectedDrawingId,
    })),
  setSelectedDrawing: (id) => set({ selectedDrawingId: id }),
  setReplayIndex: (index) => set((state) => ({ replayIndex: Math.max(0, Math.min(index, state.maxReplayIndex)) })),
  setReplayBounds: (maxIndex, candlesForFrame) =>
    set((state) => {
      const replayIndex = findReplayIndexByStartTime(candlesForFrame, state.replayStartTime);
      return { maxReplayIndex: Math.max(0, maxIndex), replayIndex };
    }),
  setReplayRunning: (running) => set({ replayRunning: running }),
  setReplaySpeed: (speed) => set({ replaySpeed: speed }),
  resetReplayStart: (candlesForFrame) =>
    set((state) => ({ replayIndex: findReplayIndexByStartTime(candlesForFrame, state.replayStartTime) })),
  saveSession: () => {
    const state = get();
    const payload: SessionState = {
      symbol: state.symbol,
      timeframe: state.timeframe,
      customTimeframes: state.customTimeframes,
      drawings: state.drawings,
      replayIndex: state.replayIndex,
      replaySpeed: state.replaySpeed,
      replayStartTime: state.replayStartTime,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  },
  loadSession: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as SessionState;
      set({
        symbol: parsed.symbol,
        timeframe: parsed.timeframe,
        customTimeframes: parsed.customTimeframes,
        drawings: parsed.drawings,
        replayIndex: parsed.replayIndex,
        replaySpeed: parsed.replaySpeed,
        replayStartTime: parsed.replayStartTime,
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
}));
