import { create } from 'zustand';
import { DEFAULT_TIMEFRAMES } from './timeframes';
import type { Candle, DrawingObject, SessionState, SymbolName, ToolType } from '../types';

const STORAGE_KEY = 'replaychart-pro-session-v1';

interface ReplayStore extends SessionState {
  candles1m: Candle[];
  isLoaded: boolean;
  dataSource: 'binance' | 'synthetic' | null;
  activeTool: ToolType;
  selectedDrawingId: string | null;
  replayRunning: boolean;
  setLoadedData: (symbol: SymbolName, candles: Candle[], source: 'binance' | 'synthetic') => void;
  setTimeframe: (timeframe: string) => void;
  addCustomTimeframe: (timeframe: string) => void;
  setActiveTool: (tool: ToolType) => void;
  addDrawing: (drawing: DrawingObject) => void;
  updateDrawing: (id: string, patch: Partial<DrawingObject>) => void;
  removeDrawing: (id: string) => void;
  setSelectedDrawing: (id: string | null) => void;
  setReplayIndex: (index: number) => void;
  setReplayRunning: (running: boolean) => void;
  setReplaySpeed: (speed: number) => void;
  resetReplayStart: () => void;
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
};

export const useReplayStore = create<ReplayStore>((set, get) => ({
  ...defaults,
  candles1m: [],
  isLoaded: false,
  dataSource: null,
  activeTool: 'cursor',
  selectedDrawingId: null,
  replayRunning: false,
  setLoadedData: (symbol, candles, source) =>
    set((state) => ({
      symbol,
      candles1m: candles,
      isLoaded: true,
      dataSource: source,
      replayIndex: Math.max(state.replayIndex, Math.floor(candles.length * 0.35)),
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
    set((state) => ({
      drawings: state.drawings.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    })),
  removeDrawing: (id) =>
    set((state) => ({
      drawings: state.drawings.filter((d) => d.id !== id),
      selectedDrawingId: state.selectedDrawingId === id ? null : state.selectedDrawingId,
    })),
  setSelectedDrawing: (id) => set({ selectedDrawingId: id }),
  setReplayIndex: (index) =>
    set((state) => ({ replayIndex: Math.max(0, Math.min(index, state.candles1m.length - 1)) })),
  setReplayRunning: (running) => set({ replayRunning: running }),
  setReplaySpeed: (speed) => set({ replaySpeed: speed }),
  resetReplayStart: () => set((state) => ({ replayIndex: Math.floor(state.candles1m.length * 0.35) })),
  saveSession: () => {
    const state = get();
    const payload: SessionState = {
      symbol: state.symbol,
      timeframe: state.timeframe,
      customTimeframes: state.customTimeframes,
      drawings: state.drawings,
      replayIndex: state.replayIndex,
      replaySpeed: state.replaySpeed,
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
      });
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
}));
