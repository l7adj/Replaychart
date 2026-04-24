import type { DrawingObject } from '../types';

const fibRetracementLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.414, 1.618, 2, 2.618, 3.618, 4.236];
const fibExtensionLevels = [0, 0.382, 0.618, 1, 1.272, 1.414, 1.618, 2, 2.618, 3.618, 4.236];

const lineDash = (dash: string) => {
  if (dash === 'dashed') return [8, 6];
  if (dash === 'dotted') return [2, 5];
  return [];
};

const drawLine = (ctx: CanvasRenderingContext2D, a: [number, number], b: [number, number]) => {
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0], b[1]);
  ctx.stroke();
};

const getExtendedLineEndpoints = (
  a: [number, number],
  b: [number, number],
  width: number,
  mode: 'segment' | 'ray' | 'extended',
): [[number, number], [number, number]] => {
  if (mode === 'segment') return [a, b];
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (Math.abs(dx) < 0.0001) {
    if (mode === 'ray') return [a, [a[0], b[1] >= a[1] ? 10000 : -10000]];
    return [[a[0], -10000], [a[0], 10000]];
  }
  const slope = dy / dx;
  const yAt = (x: number) => a[1] + slope * (x - a[0]);
  if (mode === 'ray') {
    const endX = b[0] >= a[0] ? width : 0;
    return [a, [endX, yAt(endX)]];
  }
  return [[0, yAt(0)], [width, yAt(width)]];
};

const drawArrow = (ctx: CanvasRenderingContext2D, a: [number, number], b: [number, number]) => {
  drawLine(ctx, a, b);
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const length = 13;
  ctx.beginPath();
  ctx.moveTo(b[0], b[1]);
  ctx.lineTo(b[0] - length * Math.cos(angle - Math.PI / 6), b[1] - length * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(b[0], b[1]);
  ctx.lineTo(b[0] - length * Math.cos(angle + Math.PI / 6), b[1] - length * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
};

const formatPct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
const fibLabel = (level: number, price: number) => `${(level * 100).toFixed(level % 1 === 0 ? 0 : 1)}%  ${price.toFixed(2)}`;

const drawLabelBox = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: 'left' | 'right' = 'left') => {
  const paddingX = 5;
  const metrics = ctx.measureText(text);
  const width = metrics.width + paddingX * 2;
  const boxX = align === 'right' ? x - width + paddingX : x - paddingX;
  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = '#10182b';
  ctx.fillRect(boxX, y - 11, width, 16);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#dbe6ff';
  ctx.fillText(text, boxX + paddingX, y + 1);
  ctx.restore();
};

const drawPriceTag = (ctx: CanvasRenderingContext2D, price: number, y: number, width: number) => {
  drawLabelBox(ctx, price.toFixed(2), width - 6, y - 4, 'right');
};

const drawMeasurementLabel = (
  ctx: CanvasRenderingContext2D,
  a: [number, number],
  b: [number, number],
  p1: { price: number; time: number },
  p2: { price: number; time: number },
) => {
  const delta = p2.price - p1.price;
  const pct = p1.price === 0 ? 0 : (delta / p1.price) * 100;
  const minutes = Math.abs(p2.time - p1.time) / 60;
  const bars = minutes < 60 ? `${minutes.toFixed(0)}m` : minutes < 1440 ? `${(minutes / 60).toFixed(1)}h` : `${(minutes / 1440).toFixed(1)}d`;
  const text = `${delta >= 0 ? '+' : ''}${delta.toFixed(2)} (${formatPct(pct)}) · ${bars}`;
  drawLabelBox(ctx, text, (a[0] + b[0]) / 2 + 8, (a[1] + b[1]) / 2 - 8);
};

const drawFibGuide = (
  ctx: CanvasRenderingContext2D,
  levels: number[],
  prices: number[],
  ys: number[],
  startX: number,
  endX: number,
  labelX: number,
) => {
  ctx.save();
  ctx.setLineDash([]);
  for (let i = 0; i < ys.length; i += 1) {
    const y = ys[i];
    if (!Number.isFinite(y)) continue;

    if (i > 0 && i < ys.length) {
      const prevY = ys[i - 1];
      if (Number.isFinite(prevY)) {
        ctx.save();
        ctx.globalAlpha = i % 2 === 0 ? 0.035 : 0.06;
        ctx.fillRect(startX, Math.min(prevY, y), endX - startX, Math.abs(prevY - y));
        ctx.restore();
      }
    }

    ctx.globalAlpha = levels[i] === 0 || levels[i] === 1 ? 0.95 : 0.72;
    ctx.lineWidth = levels[i] === 0 || levels[i] === 1 || levels[i] === 0.618 ? 1.5 : 1;
    drawLine(ctx, [startX, y], [endX, y]);
    drawLabelBox(ctx, fibLabel(levels[i], prices[i]), Math.min(labelX, endX - 110), y - 4);
  }
  ctx.restore();
};

export const renderDrawing = (
  ctx: CanvasRenderingContext2D,
  drawing: DrawingObject,
  toXY: (time: number, price: number) => [number, number] | null,
  size: { width: number; height: number },
  options?: { highlighted?: boolean; selected?: boolean; showHandles?: boolean },
) => {
  if (drawing.hidden) return;

  const highlighted = !!options?.highlighted;
  const selected = !!options?.selected;
  const shouldShowHandles = options?.showHandles ?? (selected || highlighted);

  ctx.save();
  ctx.strokeStyle = drawing.style.color;
  ctx.fillStyle = drawing.style.color;
  ctx.lineWidth = drawing.style.width + (selected ? 1 : 0);
  ctx.globalAlpha = drawing.style.opacity;
  ctx.setLineDash(lineDash(drawing.style.dash));
  ctx.font = '12px Inter, system-ui, sans-serif';

  const pts = drawing.points.map((p) => toXY(p.time, p.price)).filter(Boolean) as [number, number][];
  if (!pts.length) {
    ctx.restore();
    return;
  }

  switch (drawing.type) {
    case 'trendLine': {
      if (!pts[1]) break;
      drawLine(ctx, pts[0], pts[1]);
      drawMeasurementLabel(ctx, pts[0], pts[1], drawing.points[0], drawing.points[1]);
      break;
    }
    case 'ray':
    case 'extendedLine': {
      if (!pts[1]) break;
      const [start, end] = getExtendedLineEndpoints(pts[0], pts[1], size.width, drawing.type === 'ray' ? 'ray' : 'extended');
      drawLine(ctx, start, end);
      drawMeasurementLabel(ctx, pts[0], pts[1], drawing.points[0], drawing.points[1]);
      break;
    }
    case 'horizontalLine':
    case 'horizontalRay': {
      const y = pts[0][1];
      const startX = drawing.type === 'horizontalRay' ? pts[0][0] : 0;
      drawLine(ctx, [startX, y], [size.width, y]);
      drawPriceTag(ctx, drawing.points[0].price, y, size.width);
      break;
    }
    case 'verticalLine': {
      const x = pts[0][0];
      drawLine(ctx, [x, 0], [x, size.height]);
      drawLabelBox(ctx, new Date(drawing.points[0].time * 1000).toLocaleString(), x + 6, size.height - 18);
      break;
    }
    case 'parallelChannel': {
      if (pts.length < 3) break;
      const [a, b, c] = pts;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const d: [number, number] = [c[0] + dx, c[1] + dy];
      drawLine(ctx, a, b);
      drawLine(ctx, c, d);
      ctx.save();
      ctx.setLineDash([4, 5]);
      drawLine(ctx, [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2], [(b[0] + d[0]) / 2, (b[1] + d[1]) / 2]);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.lineTo(d[0], d[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.closePath();
      if (drawing.style.fill) ctx.fill();
      ctx.restore();
      break;
    }
    case 'rectangleZone': {
      if (!pts[1]) break;
      const [a, b] = pts;
      const x = Math.min(a[0], b[0]);
      const y = Math.min(a[1], b[1]);
      const w = Math.abs(a[0] - b[0]);
      const h = Math.abs(a[1] - b[1]);
      if (drawing.style.fill) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.12, drawing.style.opacity);
        ctx.fillRect(x, y, w, h);
        ctx.restore();
      }
      ctx.strokeRect(x, y, w, h);
      drawLabelBox(ctx, `${Math.abs(drawing.points[1].price - drawing.points[0].price).toFixed(2)} range`, x + 6, y + 15);
      break;
    }
    case 'arrow':
      if (pts[1]) drawArrow(ctx, pts[0], pts[1]);
      break;
    case 'path':
    case 'brush': {
      if (pts.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      break;
    }
    case 'fibRetracement': {
      if (!pts[1]) break;
      const [a, b] = pts;
      const [p1, p2] = drawing.points;
      const startX = Math.min(a[0], b[0]);
      const endX = size.width;
      const labelX = Math.max(a[0], b[0]) + 8;
      const prices = fibRetracementLevels.map((lvl) => p1.price + (p2.price - p1.price) * lvl);
      const ys = prices.map((price) => toXY(p2.time, price)?.[1] ?? Number.NaN);

      ctx.save();
      ctx.globalAlpha = 0.5;
      drawLine(ctx, a, b);
      drawLine(ctx, [startX, a[1]], [startX, b[1]]);
      ctx.restore();
      drawFibGuide(ctx, fibRetracementLevels, prices, ys, startX, endX, labelX);
      break;
    }
    case 'fibExtension': {
      if (drawing.points.length < 3 || pts.length < 3) break;
      const [p1, p2, p3] = drawing.points;
      const [a, b, c] = pts;
      const range = p2.price - p1.price;
      const startX = Math.min(a[0], b[0], c[0]);
      const endX = size.width;
      const labelX = c[0] + 8;
      const prices = fibExtensionLevels.map((lvl) => p3.price + range * lvl);
      const ys = prices.map((price) => toXY(p3.time, price)?.[1] ?? Number.NaN);

      ctx.save();
      ctx.globalAlpha = 0.5;
      drawLine(ctx, a, b);
      drawLine(ctx, b, c);
      ctx.restore();
      drawFibGuide(ctx, fibExtensionLevels, prices, ys, startX, endX, labelX);
      break;
    }
    case 'elliottImpulse': {
      const labels = ['', '1', '2', '3', '4', '5'];
      pts.forEach((p, i) => {
        if (i > 0) drawLine(ctx, pts[i - 1], p);
        const label = labels[i];
        if (label) ctx.fillText(label, p[0] + 6, p[1] - 6);
      });
      break;
    }
    case 'elliottCorrection': {
      const labels = ['', 'A', 'B', 'C'];
      pts.forEach((p, i) => {
        if (i > 0) drawLine(ctx, pts[i - 1], p);
        const label = labels[i];
        if (label) ctx.fillText(label, p[0] + 6, p[1] - 6);
      });
      break;
    }
    case 'longPosition':
    case 'shortPosition': {
      if (!pts[1]) break;
      const [a, b] = pts;
      const x = Math.min(a[0], b[0]);
      const w = Math.abs(a[0] - b[0]);
      const mid = (a[1] + b[1]) / 2;
      const top = Math.min(a[1], b[1]);
      const bottom = Math.max(a[1], b[1]);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = drawing.type === 'longPosition' ? '#00c853' : '#d50000';
      ctx.fillRect(x, top, w, mid - top);
      ctx.fillStyle = drawing.type === 'longPosition' ? '#d50000' : '#00c853';
      ctx.fillRect(x, mid, w, bottom - mid);
      ctx.globalAlpha = 1;
      ctx.fillStyle = drawing.style.color;
      ctx.fillText(drawing.type === 'longPosition' ? 'LONG' : 'SHORT', x + 8, top + 14);
      ctx.strokeRect(x, top, w, bottom - top);
      break;
    }
    case 'priceRange': {
      if (!pts[1]) break;
      const [a, b] = pts;
      drawLine(ctx, [a[0], a[1]], [a[0], b[1]]);
      drawLine(ctx, [a[0] - 10, a[1]], [a[0] + 10, a[1]]);
      drawLine(ctx, [a[0] - 10, b[1]], [a[0] + 10, b[1]]);
      const delta = drawing.points[1].price - drawing.points[0].price;
      const pct = (delta / drawing.points[0].price) * 100;
      drawLabelBox(ctx, `${delta.toFixed(2)} (${formatPct(pct)})`, a[0] + 12, (a[1] + b[1]) / 2);
      break;
    }
    case 'dateRange': {
      if (!pts[1]) break;
      const [a, b] = pts;
      const top = Math.min(a[1], b[1]);
      const bottom = Math.max(a[1], b[1]);
      drawLine(ctx, [a[0], top], [a[0], bottom]);
      drawLine(ctx, [b[0], top], [b[0], bottom]);
      drawArrow(ctx, [a[0], bottom + 18], [b[0], bottom + 18]);
      drawArrow(ctx, [b[0], bottom + 28], [a[0], bottom + 28]);
      const minutes = Math.abs(drawing.points[1].time - drawing.points[0].time) / 60;
      const label = minutes >= 1440 ? `${(minutes / 1440).toFixed(1)}d` : `${minutes.toFixed(0)}m`;
      drawLabelBox(ctx, label, Math.min(a[0], b[0]) + Math.abs(a[0] - b[0]) / 2 - 10, bottom + 45);
      break;
    }
    case 'textNote': {
      const text = drawing.text || 'Note';
      drawLabelBox(ctx, text, pts[0][0], pts[0][1]);
      break;
    }
    default:
      break;
  }

  if (!drawing.locked && shouldShowHandles) {
    const handleColor = selected ? '#ffffff' : '#f3f7ff';
    const borderColor = selected ? '#2f6fff' : drawing.style.color;
    pts.forEach(([x, y]) => {
      ctx.save();
      ctx.fillStyle = handleColor;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(x, y, selected ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  if (highlighted && !selected) {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = drawing.style.color;
    ctx.lineWidth = drawing.style.width + 4;
    ctx.setLineDash([]);
    if (pts.length > 1) {
      for (let i = 1; i < pts.length; i += 1) drawLine(ctx, pts[i - 1], pts[i]);
    }
    ctx.restore();
  }

  ctx.restore();
};
