import { useReplayStore } from '../lib/store';
import { getTool } from '../tools/toolRegistry';

export function ObjectTree() {
  const drawings = useReplayStore((s) => s.drawings);
  const selected = useReplayStore((s) => s.selectedDrawingId);
  const setSelected = useReplayStore((s) => s.setSelectedDrawing);
  const update = useReplayStore((s) => s.updateDrawing);
  const remove = useReplayStore((s) => s.removeDrawing);

  return (
    <div className="panel">
      <h3>Object Tree</h3>
      {drawings.map((d) => (
        <div key={d.id} className={`row ${selected === d.id ? 'active' : ''}`} onClick={() => setSelected(d.id)}>
          <span>{getTool(d.type)?.label ?? d.type}</span>
          <div>
            <button onClick={(e) => { e.stopPropagation(); update(d.id, { hidden: !d.hidden }); }}>{d.hidden ? 'Show' : 'Hide'}</button>
            <button onClick={(e) => { e.stopPropagation(); update(d.id, { locked: !d.locked }); }}>{d.locked ? 'Unlock' : 'Lock'}</button>
            <button onClick={(e) => { e.stopPropagation(); remove(d.id); }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
