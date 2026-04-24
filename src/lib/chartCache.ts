import type { Candle, SymbolName } from '../types';

const DB_NAME = 'replaychart-pro-db';
const DB_VERSION = 1;
const STORE_NAME = 'chart-cache';
const CACHE_KEY = 'last-loaded-chart';

export interface ChartCachePayload {
  version: 1;
  savedAt: number;
  symbol: SymbolName;
  candles: Candle[];
  source: 'binance' | 'synthetic';
  replayStartTime: number;
}

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const saveChartCache = async (payload: ChartCachePayload): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(payload, CACHE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
};

export const loadChartCache = async (): Promise<ChartCachePayload | null> => {
  const db = await openDb();
  const payload = await new Promise<ChartCachePayload | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(CACHE_KEY);
    request.onsuccess = () => resolve((request.result as ChartCachePayload | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return payload;
};

export const clearChartCache = async (): Promise<void> => {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(CACHE_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
};
