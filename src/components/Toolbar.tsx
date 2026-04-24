import { useMemo, useState } from 'react';
import { TOOLS } from '../tools/toolRegistry';
import { useReplayStore } from '../lib/store';

const groups = [
  ['favorites', 'Select'],
  ['trend', 'Trend'],
  ['gannFib', 'Fibonacci'],
  ['forecast', 'Measure'],
  ['shapes', 'Shapes'],
  ['patterns', 'Patterns'],
  ['note', 'Notes'],
] as const;

const shortLabel = (label: string) =>
  label
    .replace('Fibonacci', 'Fib')
    .replace('Retracement', 'Retrace')
    .replace('Extension', 'Ext')
    .replace('Horizontal', 'H')
    .replace('Vertical', 'V')
    .replace('Parallel', 'Parallel')
    .replace('Rectangle', 'Rect');

export function Toolbar() {
  const activeTool = useReplayStore((s) => s.activeTool);
  const setActiveTool = useReplayStore((s) => s.setActiveTool);
  const [group, setGroup] = useState<(typeof groups)[number][0]>('gannFib');

  const list = useMemo(() => TOOLS.filter((tool) => tool.category === group), [group]);
  const active = TOOLS.find((tool) => tool.type === activeTool);

  return (
    <aside className="left-toolbar professional-toolbar">
      <div className="toolbar-status">
        <span>Active Tool</span>
        <strong>{active?.label ?? 'Select'}</strong>
      </div>

      <div className="toolbar-groups">
        {groups.map(([id, label]) => (
          <button key={id} className={group === id ? 'active' : ''} onClick={() => setGroup(id)} title={label}>
            {label}
          </button>
        ))}
      </div>

      <div className="toolbar-tool-list">
        {list.map((tool) => (
          <button
            key={tool.type}
            className={`tool-button ${activeTool === tool.type ? 'active' : ''}`}
            onClick={() => setActiveTool(tool.type)}
            title={tool.label}
          >
            <span className="tool-dot" />
            <span>{shortLabel(tool.label)}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
