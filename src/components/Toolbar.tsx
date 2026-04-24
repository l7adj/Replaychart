import { TOOLS } from '../tools/toolRegistry';
import { useReplayStore } from '../lib/store';

export function Toolbar() {
  const activeTool = useReplayStore((s) => s.activeTool);
  const setActiveTool = useReplayStore((s) => s.setActiveTool);

  return (
    <aside className="left-toolbar">
      {TOOLS.map((tool) => (
        <button
          key={tool.type}
          className={activeTool === tool.type ? 'active' : ''}
          onClick={() => setActiveTool(tool.type)}
          title={tool.label}
        >
          {tool.label}
        </button>
      ))}
    </aside>
  );
}
