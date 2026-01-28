import type { TrendPoint } from "../types";

export function buildLinePath(points: TrendPoint[]) {
  const viewHeight = 180;
  const padding = 16;

  // ✅ defensivo: evita crash se points vier vazio (API-ready)
  if (points.length === 0) {
    const viewWidth = 320; // mantém layout mínimo
    return { linePath: "", areaPath: "", viewWidth, coords: [] as Array<{ x: number; y: number }> };
  }

  const viewWidth = Math.max(320, (points.length - 1) * 70);

  // ✅ calcula min/max em 1 passe (evita Math.min/max com spread e array vazio)
  let minValue = points[0].value;
  let maxValue = points[0].value;

  for (let i = 1; i < points.length; i++) {
    const v = points[i].value;
    if (v < minValue) minValue = v;
    if (v > maxValue) maxValue = v;
  }

  const range = Math.max(maxValue - minValue, 1);
  const step = (viewWidth - padding * 2) / Math.max(points.length - 1, 1);

  const coords = points.map((point, index) => {
    const x = padding + index * step;
    const normalized = (point.value - minValue) / range;
    const y = viewHeight - padding - normalized * (viewHeight - padding * 2);
    return { x, y };
  });

  const linePath = coords
    .map((coord, index) => {
      // ✅ mantém exatamente o mesmo formato de path
      return `${index === 0 ? "M" : "L"} ${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`;
    })
    .join(" ");

  const first = coords[0];
  const last = coords[coords.length - 1];

  // ✅ área fecha no “chão” (viewHeight - padding), igual ao original
  const areaPath = `${linePath} L ${last.x.toFixed(2)} ${(
    viewHeight - padding
  ).toFixed(2)} L ${first.x.toFixed(2)} ${(viewHeight - padding).toFixed(2)} Z`;

  return { linePath, areaPath, viewWidth, coords };
}
