export type SymbolName = 'BTCUSDT' | 'ETHUSDT' | 'SOLUSDT' | 'BNBUSDT';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type DashStyle = 'solid' | 'dashed' | 'dotted';

export interface DrawingPoint {
  time: number;
  price: number;
}

export interface DrawingStyle {
  color: string;
  width: number;
  dash: DashStyle;
  opacity: number;
  fill: boolean;
  extendRight?: boolean;
  extendLeft?: boolean;
}

export interface FibLevelSetting {
  value: number;
  visible: boolean;
  color?: string;
}

export interface FibSettings {
  levels: FibLevelSetting[];
  extendLeft: boolean;
  extendRight: boolean;
  reverse: boolean;
  showPrices: boolean;
  showPercents: boolean;
  labelsPosition: 'left' | 'right';
  fillBackground: boolean;
}

export type ToolType =
  | 'cursor'
  | 'trendLine'
  | 'ray'
  | 'extendedLine'
  | 'horizontalLine'
  | 'horizontalRay'
  | 'verticalLine'
  | 'parallelChannel'
  | 'rectangleZone'
  | 'arrow'
  | 'path'
  | 'brush'
  | 'fibRetracement'
  | 'fibExtension'
  | 'elliottImpulse'
  | 'elliottCorrection'
  | 'longPosition'
  | 'shortPosition'
  | 'priceRange'
  | 'dateRange'
  | 'textNote';

export interface DrawingObject {
  id: string;
  type: ToolType;
  symbol: string;
  createdOnTimeframe: string;
  visibleOn: string[];
  points: DrawingPoint[];
  style: DrawingStyle;
  locked: boolean;
  hidden: boolean;
  text?: string;
  fib?: FibSettings;
}

export interface SessionState {
  symbol: SymbolName;
  timeframe: string;
  customTimeframes: string[];
  drawings: DrawingObject[];
  replayIndex: number;
  replaySpeed: number;
  replayStartTime: number;
}

export interface ToolDefinition {
  type: ToolType;
  label: string;
  category:
    | 'favorites'
    | 'trend'
    | 'gannFib'
    | 'patterns'
    | 'forecast'
    | 'shapes'
    | 'note';
  pointsRequired: number;
}
