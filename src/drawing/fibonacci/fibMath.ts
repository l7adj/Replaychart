import type { DrawingPoint, FibSettings } from '../../types';
import { resolveFibSettings } from './fibDefaults';

export interface FibComputedLevel {
  value: number;
  price: number;
  visible: boolean;
  color?: string;
}

export const computeFibRetracementLevels = (
  points: DrawingPoint[],
  rawSettings?: Partial<FibSettings>,
): FibComputedLevel[] => {
  if (points.length < 2) return [];
  const settings = resolveFibSettings(rawSettings);
  const [p1, p2] = points;
  const fromPrice = settings.reverse ? p2.price : p1.price;
  const toPrice = settings.reverse ? p1.price : p2.price;

  return settings.levels.map((level) => ({
    ...level,
    price: fromPrice + (toPrice - fromPrice) * level.value,
  }));
};

export const computeFibExtensionLevels = (
  points: DrawingPoint[],
  rawSettings?: Partial<FibSettings>,
): FibComputedLevel[] => {
  if (points.length < 3) return [];
  const settings = resolveFibSettings(rawSettings);
  const [p1, p2, p3] = points;
  const range = settings.reverse ? p1.price - p2.price : p2.price - p1.price;

  return settings.levels.map((level) => ({
    ...level,
    price: p3.price + range * level.value,
  }));
};

export const formatFibPercent = (value: number) => `${(value * 100).toFixed(value % 1 === 0 ? 0 : 1)}%`;

export const makeFibLabel = (settings: FibSettings, level: FibComputedLevel): string => {
  const parts: string[] = [];
  if (settings.showPercents) parts.push(formatFibPercent(level.value));
  if (settings.showPrices) parts.push(level.price.toFixed(2));
  return parts.join('  ');
};
