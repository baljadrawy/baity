/**
 * MiniSparkline — رسم خطّي صغير داخل بطاقات الـ KPI
 * Pure SVG، بدون أي dependency
 * Server Component — يستقبل قيم numeric ويرسم
 */

interface MiniSparklineProps {
  values: number[];
  /** لون الخط (CSS color أو متغير) */
  color?: string;
  width?: number;
  height?: number;
  /** ملء خفيف تحت الخط */
  fill?: boolean;
  /** نص بديل لقارئ الشاشة */
  ariaLabel?: string;
}

export function MiniSparkline({
  values,
  color = 'currentColor',
  width = 80,
  height = 28,
  fill = true,
  ariaLabel,
}: MiniSparklineProps) {
  if (values.length < 2) {
    return <div style={{ width, height }} aria-hidden="true" />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * innerW;
    const y = padding + innerH - ((v - min) / range) * innerH;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');

  const first = points[0];
  const last = points[points.length - 1];
  const areaPath =
    first && last
      ? `${linePath} L${last[0].toFixed(2)},${(height - padding).toFixed(2)} ` +
        `L${first[0].toFixed(2)},${(height - padding).toFixed(2)} Z`
      : '';

  const gradId = `spark-${values.join('-')}-${color}`.replace(/[^a-zA-Z0-9-]/g, '');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
      style={{ color, overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={areaPath} fill={`url(#${gradId})`} />}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
