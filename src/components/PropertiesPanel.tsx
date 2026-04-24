import type { DashStyle, FibSettings } from '../types';
import { useReplayStore } from '../lib/store';

const DEFAULT_FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.414, 1.618, 2, 2.618, 3.618, 4.236];

const makeDefaultFibSettings = (): FibSettings => ({
  levels: DEFAULT_FIB_LEVELS.map((value) => ({ value, visible: true })),
  extendLeft: false,
  extendRight: true,
  reverse: false,
  showPrices: true,
  showPercents: true,
  labelsPosition: 'right',
  fillBackground: true,
});

const isFibTool = (type: string) => type.startsWith('fib');

export function PropertiesPanel() {
  const selectedId = useReplayStore((s) => s.selectedDrawingId);
  const drawing = useReplayStore((s) => s.drawings.find((d) => d.id === selectedId));
  const update = useReplayStore((s) => s.updateDrawing);
  const remove = useReplayStore((s) => s.removeDrawing);

  if (!drawing) return <div className="panel"><h3>Properties</h3><p>Select drawing</p></div>;

  const fib = drawing.fib ?? makeDefaultFibSettings();
  const updateFib = (patch: Partial<FibSettings>) => update(drawing.id, { fib: { ...fib, ...patch } });

  return (
    <div className="panel">
      <h3>Properties</h3>
      <label>Color <input type="color" value={drawing.style.color} onChange={(e) => update(drawing.id, { style: { ...drawing.style, color: e.target.value } })} /></label>
      <label>Width <input type="range" min={1} max={8} value={drawing.style.width} onChange={(e) => update(drawing.id, { style: { ...drawing.style, width: Number(e.target.value) } })} /></label>
      <label>Dash
        <select value={drawing.style.dash} onChange={(e) => update(drawing.id, { style: { ...drawing.style, dash: e.target.value as DashStyle } })}>
          <option value="solid">solid</option>
          <option value="dashed">dashed</option>
          <option value="dotted">dotted</option>
        </select>
      </label>
      <label>Opacity <input type="range" min={0.1} max={1} step={0.05} value={drawing.style.opacity} onChange={(e) => update(drawing.id, { style: { ...drawing.style, opacity: Number(e.target.value) } })} /></label>
      <label>Fill <input type="checkbox" checked={drawing.style.fill} onChange={(e) => update(drawing.id, { style: { ...drawing.style, fill: e.target.checked } })} /></label>

      {isFibTool(drawing.type) && (
        <div className="panel">
          <h3>Fibonacci</h3>
          <label>Extend Right <input type="checkbox" checked={fib.extendRight} onChange={(e) => updateFib({ extendRight: e.target.checked })} /></label>
          <label>Extend Left <input type="checkbox" checked={fib.extendLeft} onChange={(e) => updateFib({ extendLeft: e.target.checked })} /></label>
          <label>Reverse <input type="checkbox" checked={fib.reverse} onChange={(e) => updateFib({ reverse: e.target.checked })} /></label>
          <label>Show Prices <input type="checkbox" checked={fib.showPrices} onChange={(e) => updateFib({ showPrices: e.target.checked })} /></label>
          <label>Show Percents <input type="checkbox" checked={fib.showPercents} onChange={(e) => updateFib({ showPercents: e.target.checked })} /></label>
          <label>Fill Zones <input type="checkbox" checked={fib.fillBackground} onChange={(e) => updateFib({ fillBackground: e.target.checked })} /></label>
          <label>Labels
            <select value={fib.labelsPosition} onChange={(e) => updateFib({ labelsPosition: e.target.value as 'left' | 'right' })}>
              <option value="right">right</option>
              <option value="left">left</option>
            </select>
          </label>
          <div className="panel">
            <strong>Levels</strong>
            {fib.levels.map((level, index) => (
              <label key={`${level.value}-${index}`}>
                <input
                  type="checkbox"
                  checked={level.visible}
                  onChange={(e) => {
                    const levels = fib.levels.map((item, i) => (i === index ? { ...item, visible: e.target.checked } : item));
                    updateFib({ levels });
                  }}
                />
                {(level.value * 100).toFixed(level.value % 1 === 0 ? 0 : 1)}%
              </label>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => remove(drawing.id)}>Delete Selected</button>
    </div>
  );
}
