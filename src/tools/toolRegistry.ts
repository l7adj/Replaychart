import type { ToolDefinition } from '../types';

export const TOOLS: ToolDefinition[] = [
  { type: 'cursor', label: 'Cursor', category: 'favorites', pointsRequired: 0 },
  { type: 'trendLine', label: 'Trend Line', category: 'trend', pointsRequired: 2 },
  { type: 'ray', label: 'Ray', category: 'trend', pointsRequired: 2 },
  { type: 'extendedLine', label: 'Extended Line', category: 'trend', pointsRequired: 2 },
  { type: 'horizontalLine', label: 'Horizontal Line', category: 'trend', pointsRequired: 1 },
  { type: 'horizontalRay', label: 'Horizontal Ray', category: 'trend', pointsRequired: 1 },
  { type: 'verticalLine', label: 'Vertical Line', category: 'trend', pointsRequired: 1 },
  { type: 'rectangleZone', label: 'Rectangle Zone', category: 'shapes', pointsRequired: 2 },
  { type: 'fibRetracement', label: 'Fib Retracement', category: 'gannFib', pointsRequired: 2 },
  { type: 'fibExtension', label: 'Fib Extension', category: 'gannFib', pointsRequired: 3 },
  { type: 'elliottImpulse', label: 'Elliott Impulse 1-5', category: 'patterns', pointsRequired: 6 },
  { type: 'elliottCorrection', label: 'Elliott Correction ABC', category: 'patterns', pointsRequired: 4 },
  { type: 'longPosition', label: 'Long Position', category: 'forecast', pointsRequired: 2 },
  { type: 'shortPosition', label: 'Short Position', category: 'forecast', pointsRequired: 2 },
  { type: 'textNote', label: 'Text Note', category: 'note', pointsRequired: 1 },
];

export const getTool = (type: string) => TOOLS.find((tool) => tool.type === type);
