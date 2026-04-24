import { useEffect, useMemo, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { coordinateToDomain } from '../lib/coordinates';
import { useReplayStore } from '../lib/store';
import { getTool } from '../tools/toolRegistry';
import { renderDrawing } from '../tools/renderers';
import type { DrawingObject, DrawingPoint } from '../types';

const defaultStyle = {
  color: '#4da3ff',
  width: 2,
  dash: 'solid' as const,
  opacity: 1,
  fill: true,
};

export function DrawingLayer({ chart, series }: { chart: IChartApi | null; series: ISeriesApi<'Candlestick'> | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState<DrawingPoint[]>([]);
  const [dragging, setDragging] = useState<{ id: string; index: number } | null>(null);

  const drawings = useReplayStore((s) => s.drawings);
  const selectedId = useReplayStore((s) => s.selectedDrawingId);
  const activeTool = useReplayStore((s) => s.activeTool);
  const symbol = useReplayStore((s) => s.symbol);
  const timeframe = useReplayStore((s) => s.timeframe);
  const addDrawing = useReplayStore((s) => s.addDrawing);
  const setSelected = useReplayStore((s) => s.setSelectedDrawing);
  const updateDrawing = useReplayStore((s) => s.updateDrawing);

  const toXY = useMemo(
    () =>
      (time: number, price: number): [number, number] | null => {
        if (!chart || !series) return null;
        const x = chart.timeScale().timeToCoordinate(time as any);
        const y = series.priceToCoordinate(price);
        if (x === null || y === null) return null;
        return [x, y];
      },
    [chart, series],
  );

  useEffect(() => {
    if (!canvasRef.current || !hostRef.current || !chart) return;
    const canvas = canvasRef.current;
    const host = hostRef.current;

    const resize = () => {
      canvas.width = host.clientWidth;
      canvas.height = host.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    const paint = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawings.forEach((d) => renderDrawing(ctx, d, toXY, { width: canvas.width, height: canvas.height }));
      if (draft.length) {
        const preview: DrawingObject = {
          id: 'draft',
          type: activeTool,
          symbol,
          createdOnTimeframe: timeframe,
          visibleOn: [timeframe],
          points: draft,
          style: defaultStyle,
          locked: false,
          hidden: false,
        };
        renderDrawing(ctx, preview, toXY, { width: canvas.width, height: canvas.height });
      }
      if (selectedId) {
        const selected = drawings.find((d) => d.id === selectedId);
        if (selected) {
          ctx.save();
          ctx.strokeStyle = '#ffeb3b';
          ctx.lineWidth = 1;
          selected.points.forEach((p) => {
            const xy = toXY(p.time, p.price);
            if (!xy) return;
            ctx.strokeRect(xy[0] - 6, xy[1] - 6, 12, 12);
          });
          ctx.restore();
        }
      }
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    };

    const unsub = chart.timeScale().subscribeVisibleLogicalRangeChange(schedule);
    schedule();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(schedule);
      unsub;
    };
  }, [drawings, draft, toXY, chart, activeTool, selectedId, symbol, timeframe]);

  const hitTest = (x: number, y: number): { id: string; index: number } | null => {
    for (const d of drawings) {
      if (d.locked || d.hidden) continue;
      for (let i = 0; i < d.points.length; i += 1) {
        const pt = toXY(d.points[i].time, d.points[i].price);
        if (!pt) continue;
        if (Math.hypot(pt[0] - x, pt[1] - y) < 10) return { id: d.id, index: i };
      }
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!chart || !series) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const domain = coordinateToDomain(chart, series, x, y);
    if (!domain) return;

    if (activeTool === 'cursor') {
      const hit = hitTest(x, y);
      setSelected(hit?.id ?? null);
      setDragging(hit);
      return;
    }

    const tool = getTool(activeTool);
    if (!tool) return;
    const next = [...draft, domain];
    if (next.length >= tool.pointsRequired) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const text = activeTool === 'textNote' ? 'Text Note' : undefined;
      addDrawing({
        id,
        type: activeTool,
        symbol,
        createdOnTimeframe: timeframe,
        visibleOn: [timeframe],
        points: next,
        style: defaultStyle,
        locked: false,
        hidden: false,
        text,
      });
      setSelected(id);
      setDraft([]);
    } else {
      setDraft(next);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging || !chart || !series) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const domain = coordinateToDomain(chart, series, x, y);
    if (!domain) return;
    const drawing = drawings.find((d) => d.id === dragging.id);
    if (!drawing) return;
    const points = drawing.points.map((p, index) => (index === dragging.index ? domain : p));
    updateDrawing(drawing.id, { points });
  };

  return (
    <div className="drawing-host" ref={hostRef}>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => setDragging(null)}
      />
    </div>
  );
}
