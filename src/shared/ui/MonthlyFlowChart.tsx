/**
 * MonthlyFlowChart — رسم أعمدة لمصروفات الشهر (آخر 6 أشهر)
 * Pure SVG، لا dependency. لون العمود يتدرّج: warning للمتوسّط، error للقمم.
 *
 * Server Component — يستقبل بيانات حقيقية من BillPayment.
 */

interface FlowPoint {
  /** اسم الشهر مختصر (مثلاً "ديسمبر") */
  label: string;
  expenses: number;
}

interface MonthlyFlowChartProps {
  data: FlowPoint[];
  expensesColor?: string;
  /** نص بديل لقارئ الشاشة */
  ariaLabel?: string;
  height?: number;
}

export function MonthlyFlowChart({
  data,
  expensesColor = 'var(--color-error)',
  ariaLabel,
  height = 220,
}: MonthlyFlowChartProps) {
  if (data.length === 0) return null;

  const width = 600;
  const padTop = 16;
  const padBottom = 36;
  const padX = 24;
  const innerH = height - padTop - padBottom;
  const innerW = width - padX * 2;

  const maxV = Math.max(...data.map((d) => d.expenses), 1);
  const niceMax = Math.ceil(maxV / 1000) * 1000 || maxV;

  const groupWidth = innerW / data.length;
  const barWidth = Math.min(36, groupWidth - 16);

  const gridSteps = 4;
  const gridlines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    return padTop + (innerH * i) / gridSteps;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full h-auto"
      style={{ minHeight: height }}
      role={ariaLabel ? 'img' : 'presentation'}
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id="expensesBar" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={expensesColor} stopOpacity="0.95" />
          <stop offset="100%" stopColor={expensesColor} stopOpacity="0.45" />
        </linearGradient>
      </defs>

      {gridlines.map((y, i) => (
        <line
          key={i}
          x1={padX}
          x2={width - padX}
          y1={y}
          y2={y}
          stroke="currentColor"
          strokeOpacity={i === gridSteps ? 0.18 : 0.06}
          strokeWidth={1}
          strokeDasharray={i === gridSteps ? '0' : '3 4'}
          className="text-foreground"
        />
      ))}

      {data.map((d, i) => {
        const cx = padX + groupWidth * i + groupWidth / 2;
        const expensesH = (d.expenses / niceMax) * innerH;
        const baseY = padTop + innerH;

        return (
          <g key={i}>
            <rect
              x={cx - barWidth / 2}
              y={baseY - expensesH}
              width={barWidth}
              height={expensesH}
              rx={5}
              fill="url(#expensesBar)"
            />
            <text
              x={cx}
              y={height - 12}
              textAnchor="middle"
              fontSize="11"
              className="fill-current text-muted-foreground"
              style={{ fontFeatureSettings: '"lnum", "tnum"' }}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
