import type { ToolDefinition } from '../types';

export const TOOLS: ToolDefinition[] = [
  { type: 'cursor', label: 'Cursor', icon: '⌖', category: 'favorites', pointsRequired: 0 },
  { type: 'trendLine', label: 'Trend Line', icon: '／', category: 'trend', pointsRequired: 2 },
  { type: 'ray', label: 'Ray', icon: '↗', category: 'trend', pointsRequired: 2 },
  { type: 'extendedLine', label: 'Extended Line', icon: '⟷', category: 'trend', pointsRequired: 2 },
  { type: 'horizontalLine', label: 'Horizontal Line', icon: '━', category: 'trend', pointsRequired: 1 },
  { type: 'horizontalRay', label: 'Horizontal Ray', icon: '⟶', category: 'trend', pointsRequired: 1 },
  { type: 'verticalLine', label: 'Vertical Line', icon: '┃', category: 'trend', pointsRequired: 1 },
  { type: 'rectangleZone', label: 'Rectangle Zone', icon: '▭', category: 'shapes', pointsRequired: 2 },
  { type: 'fibRetracement', label: 'Fib Retracement', icon: '𝓕', category: 'gannFib', pointsRequired: 2 },
  { type: 'fibExtension', label: 'Fib Extension', icon: 'ℱ+', category: 'gannFib', pointsRequired: 3 },
  { type: 'elliottImpulse', label: 'Elliott Impulse 1-5', icon: '⑤', category: 'patterns', pointsRequired: 6 },
  { type: 'elliottCorrection', label: 'Elliott Correction ABC', icon: 'ABC', category: 'patterns', pointsRequired: 4 },
  { type: 'longPosition', label: 'Long Position', icon: 'L', category: 'forecast', pointsRequired: 2 },
  { type: 'shortPosition', label: 'Short Position', icon: 'S', category: 'forecast', pointsRequired: 2 },
  { type: 'textNote', label: 'Text Note', icon: 'T', category: 'note', pointsRequired: 1 },
];

export const getTool = (type: string) => TOOLS.find((tool) => tool.type === type);
