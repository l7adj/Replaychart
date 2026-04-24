import type { DashStyle } from '../types';
import { useReplayStore } from '../lib/store';

export function PropertiesPanel() {
  const selectedId = useReplayStore((s) => s.selectedDrawingId);
  const drawing = useReplayStore((s) => s.drawings.find((d) => d.id === selectedId));
  const update = useReplayStore((s) => s.updateDrawing);
  const remove = useReplayStore((s) => s.removeDrawing);

  if (!drawing) return <div className="panel"><h3>Properties</h3><p>Select drawing</p></div>;

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
      <button onClick={() => remove(drawing.id)}>Delete Selected</button>
    </div>
  );
}
