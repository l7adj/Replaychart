import type { DrawingObject } from '../types';

const fibRetracementLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const fibExtensionLevels = [0, 0.382, 0.618, 1, 1.272, 1.618, 2.618];

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

export const renderDrawing = (
  ctx: CanvasRenderingContext2D,
  drawing: DrawingObject,
  toXY: (time: number, price: number) => [number, number] | null,
  size: { width: number; height: number },
) => {
  if (drawing.hidden) return;
  ctx.save();
  ctx.strokeStyle = drawing.style.color;
  ctx.fillStyle = drawing.style.color;
  ctx.lineWidth = drawing.style.width;
  ctx.globalAlpha = drawing.style.opacity;
  ctx.setLineDash(lineDash(drawing.style.dash));

  const pts = drawing.points.map((p) => toXY(p.time, p.price)).filter(Boolean) as [number, number][];
  if (!pts.length) {
    ctx.restore();
    return;
  }

  switch (drawing.type) {
    case 'trendLine':
      if (pts[1]) drawLine(ctx, pts[0], pts[1]);
      break;
    case 'ray':
    case 'extendedLine': {
      if (!pts[1]) break;
      const [x1, y1] = pts[0];
      const [x2, y2] = pts[1];
      const slope = (y2 - y1) / ((x2 - x1) || 0.0001);
      const endX = drawing.type === 'ray' ? size.width : size.width;
      const startX = drawing.type === 'extendedLine' ? 0 : x1;
      drawLine(ctx, [startX, y1 + slope * (startX - x1)], [endX, y1 + slope * (endX - x1)]);
      break;
    }
    case 'horizontalLine':
    case 'horizontalRay': {
      const y = pts[0][1];
      const startX = drawing.type === 'horizontalRay' ? pts[0][0] : 0;
      drawLine(ctx, [startX, y], [size.width, y]);
      break;
    }
    case 'verticalLine': {
      const x = pts[0][0];
      drawLine(ctx, [x, 0], [x, size.height]);
      break;
    }
    case 'rectangleZone': {
      if (!pts[1]) break;
      const [a, b] = pts;
      const x = Math.min(a[0], b[0]);
      const y = Math.min(a[1], b[1]);
      const w = Math.abs(a[0] - b[0]);
      const h = Math.abs(a[1] - b[1]);
      if (drawing.style.fill) ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      break;
    }
    case 'fibRetracement': {
      if (!pts[1]) break;
      const [a, b] = pts;
      fibRetracementLevels.forEach((lvl) => {
        const y = a[1] + (b[1] - a[1]) * lvl;
        drawLine(ctx, [Math.min(a[0], b[0]), y], [Math.max(a[0], b[0]), y]);
        const price = drawing.points[0].price + (drawing.points[1].price - drawing.points[0].price) * lvl;
        ctx.fillText(`${lvl.toFixed(3)} ${price.toFixed(2)}`, Math.max(a[0], b[0]) + 8, y + 4);
      });
      break;
    }
    case 'fibExtension': {
      if (pts.length < 3) break;
      const [a, b, c] = drawing.points;
      const base = b.price - a.price;
      fibExtensionLevels.forEach((lvl) => {
        const projected = c.price + base * lvl;
        const y = toXY(c.time, projected)?.[1];
        if (!y) return;
        drawLine(ctx, [0, y], [size.width, y]);
        ctx.fillText(`${lvl.toFixed(3)} ${projected.toFixed(2)}`, 6, y - 4);
      });
      break;
    }
    case 'elliottImpulse': {
      pts.forEach((p, i) => {
        if (i > 0) drawLine(ctx, pts[i - 1], p);
        ctx.fillText(i.toString(), p[0] + 6, p[1] - 6);
      });
      break;
    }
    case 'elliottCorrection': {
      const labels = ['S', 'A', 'B', 'C'];
      pts.forEach((p, i) => {
        if (i > 0) drawLine(ctx, pts[i - 1], p);
        ctx.fillText(labels[i] ?? '', p[0] + 6, p[1] - 6);
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
    case 'textNote': {
      const text = drawing.text || 'Note';
      ctx.fillText(text, pts[0][0], pts[0][1]);
      break;
    }
    default:
      break;
  }

  if (!drawing.locked) {
    pts.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
};
