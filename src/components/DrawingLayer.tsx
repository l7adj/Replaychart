import { useEffect, useMemo, useRef, useState } from 'react';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { coordinateToDomain } from '../lib/coordinates';
import { useReplayStore } from '../lib/store';
import { getTool } from '../tools/toolRegistry';
import { renderDrawing } from '../tools/renderers';
import type { DrawingPoint } from '../types';

const defaultStyle = { color: '#4da3ff', width: 2, dash: 'solid' as const, opacity: 1, fill: true };
const HIT_PX = 10;

const distToSegment = (p: [number, number], a: [number, number], b: [number, number]) => {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) || 1)));
  const cx = ax + dx * t;
  const cy = ay + dy * t;
  return Math.hypot(px - cx, py - cy);
};

const fibRetracementLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const fibExtensionLevels = [0, 0.382, 0.618, 1, 1.272, 1.618, 2.618];

type DragState =
  | { type: 'handle'; id: string; index: number }
  | { type: 'body'; id: string; last: DrawingPoint };

export function DrawingLayer({ chart, series }: { chart: IChartApi | null; series: ISeriesApi<'Candlestick'> | null }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState<DrawingPoint[]>([]);
  const [dragging, setDragging] = useState<DragState | null>(null);

  const drawings = useReplayStore((s) => s.drawings);
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
        renderDrawing(
          ctx,
          {
            id: 'draft',
            type: activeTool,
            symbol,
            createdOnTimeframe: timeframe,
            visibleOn: [timeframe],
            points: draft,
            style: defaultStyle,
            locked: false,
            hidden: false,
          },
          toXY,
          { width: canvas.width, height: canvas.height },
        );
      }
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(paint);
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(schedule);
    schedule();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(schedule);
    };
  }, [drawings, draft, toXY, chart, activeTool, symbol, timeframe]);

  const hitTest = (x: number, y: number): { id: string; target: 'handle' | 'body'; index?: number } | null => {
    for (let dIdx = drawings.length - 1; dIdx >= 0; dIdx -= 1) {
      const d = drawings[dIdx];
      if (d.hidden) continue;
      const pts = d.points.map((p) => toXY(p.time, p.price)).filter(Boolean) as [number, number][];
      if (!pts.length) continue;

      for (let i = 0; i < pts.length; i += 1) {
        if (!d.locked && Math.hypot(pts[i][0] - x, pts[i][1] - y) <= HIT_PX) return { id: d.id, target: 'handle', index: i };
      }

      const p: [number, number] = [x, y];
      const nearLine = (a: [number, number], b: [number, number]) => distToSegment(p, a, b) <= HIT_PX;

      switch (d.type) {
        case 'trendLine':
          if (pts[1] && nearLine(pts[0], pts[1])) return { id: d.id, target: 'body' };
          break;
        case 'ray':
        case 'extendedLine': {
          if (!pts[1]) break;
          const [a, b] = pts;
          const dir: [number, number] = [b[0] - a[0], b[1] - a[1]];
          const dot = (x - a[0]) * dir[0] + (y - a[1]) * dir[1];
          if (d.type === 'ray' && dot < 0) break;
          const t0 = d.type === 'extendedLine' ? -10000 : 0;
          const t1 = 10000;
          const pa: [number, number] = [a[0] + dir[0] * t0, a[1] + dir[1] * t0];
          const pb: [number, number] = [a[0] + dir[0] * t1, a[1] + dir[1] * t1];
          if (nearLine(pa, pb)) return { id: d.id, target: 'body' };
          break;
        }
        case 'horizontalLine':
          if (Math.abs(y - pts[0][1]) <= HIT_PX) return { id: d.id, target: 'body' };
          break;
        case 'horizontalRay':
          if (Math.abs(y - pts[0][1]) <= HIT_PX && x >= pts[0][0] - HIT_PX) return { id: d.id, target: 'body' };
          break;
        case 'rectangleZone':
        case 'longPosition':
        case 'shortPosition': {
          if (!pts[1]) break;
          const left = Math.min(pts[0][0], pts[1][0]);
          const right = Math.max(pts[0][0], pts[1][0]);
          const top = Math.min(pts[0][1], pts[1][1]);
          const bottom = Math.max(pts[0][1], pts[1][1]);
          const inside = x >= left && x <= right && y >= top && y <= bottom;
          const border =
            Math.abs(x - left) <= HIT_PX || Math.abs(x - right) <= HIT_PX || Math.abs(y - top) <= HIT_PX || Math.abs(y - bottom) <= HIT_PX;
          if (inside || border) return { id: d.id, target: 'body' };
          break;
        }
        case 'fibRetracement': {
          if (!pts[1]) break;
          const [a, b] = pts;
          for (const lvl of fibRetracementLevels) {
            const yy = a[1] + (b[1] - a[1]) * lvl;
            if (Math.abs(y - yy) <= HIT_PX && x >= Math.min(a[0], b[0]) - HIT_PX && x <= Math.max(a[0], b[0]) + HIT_PX) {
              return { id: d.id, target: 'body' };
            }
          }
          break;
        }
        case 'fibExtension': {
          if (d.points.length < 3) break;
          const [a, b, c] = d.points;
          const base = b.price - a.price;
          for (const lvl of fibExtensionLevels) {
            const yy = toXY(c.time, c.price + base * lvl)?.[1];
            if (yy !== undefined && Math.abs(y - yy) <= HIT_PX) return { id: d.id, target: 'body' };
          }
          break;
        }
        case 'textNote':
          if (Math.abs(x - pts[0][0]) <= 45 && Math.abs(y - pts[0][1]) <= 18) return { id: d.id, target: 'body' };
          break;
        default: {
          for (let i = 1; i < pts.length; i += 1) {
            if (nearLine(pts[i - 1], pts[i])) return { id: d.id, target: 'body' };
          }
        }
      }
    }
    return null;
  };

  const forwardToChart = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.pointerEvents = 'none';
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (target) {
      target.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: e.clientX,
          clientY: e.clientY,
          button: e.button,
          pointerId: e.pointerId,
          pointerType: e.pointerType,
          pressure: e.pressure,
        }),
      );
    }
    setTimeout(() => {
      if (canvas) canvas.style.pointerEvents = 'auto';
    }, 0);
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
      if (!hit) {
        setSelected(null);
        forwardToChart(e);
        return;
      }
      setSelected(hit.id);
      if (hit.target === 'handle' && hit.index !== undefined) setDragging({ type: 'handle', id: hit.id, index: hit.index });
      else setDragging({ type: 'body', id: hit.id, last: domain });
      return;
    }

    const tool = getTool(activeTool);
    if (!tool) return;
    const next = [...draft, domain];
    if (next.length >= tool.pointsRequired) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
        text: activeTool === 'textNote' ? 'Text Note' : undefined,
      });
      setSelected(id);
      setDraft([]);
    } else setDraft(next);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging || !chart || !series) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const domain = coordinateToDomain(chart, series, e.clientX - rect.left, e.clientY - rect.top);
    if (!domain) return;

    const drawing = drawings.find((d) => d.id === dragging.id);
    if (!drawing || drawing.locked) return;

    if (dragging.type === 'handle') {
      const points = drawing.points.map((p, idx) => (idx === dragging.index ? domain : p));
      updateDrawing(drawing.id, { points });
      return;
    }

    const dt = domain.time - dragging.last.time;
    const dp = domain.price - dragging.last.price;
    updateDrawing(drawing.id, {
      points: drawing.points.map((p) => ({ time: p.time + dt, price: p.price + dp })),
    });
    setDragging({ ...dragging, last: domain });
  };

  return (
    <div className="drawing-host" ref={hostRef}>
      <canvas ref={canvasRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => setDragging(null)} />
    </div>
  );
}
