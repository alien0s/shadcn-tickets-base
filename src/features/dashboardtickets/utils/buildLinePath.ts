import type { TrendPoint } from "../types";

export function buildLinePath(points: TrendPoint[]) {
  const viewWidth = Math.max(320, (points.length - 1) * 70);
  const viewHeight = 180;
  const padding = 16;
  const values = points.map((p) => p.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(maxValue - minValue, 1);
  const step = (viewWidth - padding * 2) / Math.max(points.length - 1, 1);

  const coords = points.map((point, index) => {
    const x = padding + index * step;
    const normalized = (point.value - minValue) / range;
    const y = viewHeight - padding - normalized * (viewHeight - padding * 2);
    return { x, y };
  });

  const linePath = coords
    .map(
      (coord, index) =>
        `${index === 0 ? "M" : "L"} ${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`
    )
    .join(" ");

  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath = `${linePath} L ${last.x.toFixed(
    2
  )} ${viewHeight - padding} L ${first.x.toFixed(2)} ${
    viewHeight - padding
  } Z`;

  return { linePath, areaPath, viewWidth, coords };
}
