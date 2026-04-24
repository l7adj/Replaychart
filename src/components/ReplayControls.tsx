import type { Candle } from '../types';
import { useReplayStore } from '../lib/store';

export function ReplayControls({ max, candlesForFrame }: { max: number; candlesForFrame: Candle[] }) {
  const replayIndex = useReplayStore((s) => s.replayIndex);
  const replayRunning = useReplayStore((s) => s.replayRunning);
  const replaySpeed = useReplayStore((s) => s.replaySpeed);
  const setReplayIndex = useReplayStore((s) => s.setReplayIndex);
  const setReplayRunning = useReplayStore((s) => s.setReplayRunning);
  const setReplaySpeed = useReplayStore((s) => s.setReplaySpeed);
  const resetStart = useReplayStore((s) => s.resetReplayStart);

  return (
    <div className="replay-controls">
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
      <input type="range" min={0} max={Math.max(0, max)} value={replayIndex} onChange={(e) => setReplayIndex(Number(e.target.value))} />
    </div>
  );
}
