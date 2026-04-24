import { useMemo, useState } from 'react';
import { TOOLS } from '../tools/toolRegistry';
import { useReplayStore } from '../lib/store';

const tabs = [
  ['favorites', 'المفضلة'],
  ['trend', 'خطوط اتجاه'],
  ['gannFib', 'جان وفيبوناتشي'],
  ['patterns', 'نماذج وموجات'],
  ['forecast', 'التنبؤ والقياس'],
  ['shapes', 'الأشكال'],
  ['note', 'ملاحظة'],
] as const;

export function MobileToolSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setActiveTool = useReplayStore((s) => s.setActiveTool);
  const [tab, setTab] = useState<(typeof tabs)[number][0]>('favorites');
  const [query, setQuery] = useState('');

  const list = useMemo(
    () => TOOLS.filter((tool) => tool.category === tab && tool.label.toLowerCase().includes(query.toLowerCase())),
    [tab, query],
  );

  if (!open) return null;

  return (
    <div className="mobile-sheet">
      <input placeholder="Search tools" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="tabs">
        {tabs.map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className="tool-grid">
        {list.map((tool) => (
          <button
            key={tool.type}
            onClick={() => {
              setActiveTool(tool.type);
              onClose();
            }}
          >
            <span>{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
