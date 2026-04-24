import type { Candle } from '../types';
import { useReplayStore } from '../lib/store';

export function ReplayControls({ max, candlesForFrame, compact = false }: { max: number; candlesForFrame: Candle[]; compact?: boolean }) {
  const replayIndex = useReplayStore((s) => s.replayIndex);
  const replayRunning = useReplayStore((s) => s.replayRunning);
  const replaySpeed = useReplayStore((s) => s.replaySpeed);
  const setReplayIndex = useReplayStore((s) => s.setReplayIndex);
  const setReplayRunning = useReplayStore((s) => s.setReplayRunning);
  const setReplaySpeed = useReplayStore((s) => s.setReplaySpeed);
  const resetStart = useReplayStore((s) => s.resetReplayStart);

  return (
    <div className={`replay-controls ${compact ? 'compact' : ''}`}>
      <button onClick={() => resetStart(candlesForFrame)}>Jump to Start</button>
      <button onClick={() => setReplayRunning(!replayRunning)}>{replayRunning ? 'Pause' : 'Start'}</button>
      <button onClick={() => setReplayIndex(replayIndex - 1)}>Step Back</button>
      <button onClick={() => setReplayIndex(replayIndex + 1)}>Step Forward</button>
      <label>
        Speed
        <select value={replaySpeed} onChange={(e) => setReplaySpeed(Number(e.target.value))}>
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
          <option value={8}>8x</option>
        </select>
      </label>
      <span className="replay-counter">{Math.min(replayIndex + 1, max + 1)} / {max + 1}</span>
      <input type="range" min={0} max={Math.max(0, max)} value={Math.min(replayIndex, max)} onChange={(e) => setReplayIndex(Number(e.target.value))} />
    </div>
  );
}
