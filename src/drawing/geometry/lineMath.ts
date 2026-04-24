export type XYPoint = [number, number];

export const distanceToSegment = (p: XYPoint, a: XYPoint, b: XYPoint): number => {
  const [px, py] = p;
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = bx - ax;
  const dy = by - ay;
  const denom = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / denom));
  const cx = ax + dx * t;
  const cy = ay + dy * t;
  return Math.hypot(px - cx, py - cy);
};

export const getInfiniteLineEndpoints = (a: XYPoint, b: XYPoint, width: number): [XYPoint, XYPoint] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (Math.abs(dx) < 0.0001) return [[a[0], -10000], [a[0], 10000]];
  const slope = dy / dx;
  const yAt = (x: number) => a[1] + slope * (x - a[0]);
  return [[0, yAt(0)], [width, yAt(width)]];
};

export const getRayEndpoints = (a: XYPoint, b: XYPoint, width: number): [XYPoint, XYPoint] => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  if (Math.abs(dx) < 0.0001) return [a, [a[0], b[1] >= a[1] ? 10000 : -10000]];
  const slope = dy / dx;
  const endX = b[0] >= a[0] ? width : 0;
  return [a, [endX, a[1] + slope * (endX - a[0])]];
};
