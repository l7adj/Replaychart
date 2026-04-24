import type { FibSettings } from '../../types';

export const FIB_DEFAULT_LEVEL_VALUES = [
  0,
  0.236,
  0.382,
  0.5,
  0.618,
  0.786,
  1,
  1.272,
  1.414,
  1.618,
  2,
  2.618,
  3.618,
  4.236,
];

export const createDefaultFibSettings = (): FibSettings => ({
  levels: FIB_DEFAULT_LEVEL_VALUES.map((value) => ({ value, visible: true })),
  extendLeft: false,
  extendRight: true,
  reverse: false,
  showPrices: true,
  showPercents: true,
  labelsPosition: 'right',
  fillBackground: true,
});

export const resolveFibSettings = (settings?: Partial<FibSettings>): FibSettings => {
  const defaults = createDefaultFibSettings();
  return {
    ...defaults,
    ...settings,
    levels: settings?.levels?.length ? settings.levels : defaults.levels,
  };
};
