// SVG charts ported from the prototype's shared.js to React components.

export function Sparkline({
  values,
  width = 90,
  height = 32,
  stroke = 'var(--accent)',
  fill = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: boolean;
}) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1 || 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - ((v - min) / range) * (height - 4)).toFixed(1)}`);
  const path = `M ${pts.join(' L ')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {fill && <path d={`${path} L ${((values.length - 1) * step).toFixed(1)},${height} L 0,${height} Z`} fill={stroke} fillOpacity={0.12} />}
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export type LineSeries = { values: (number | null)[]; color?: string; fill?: boolean; dashed?: boolean; strokeWidth?: number };

export function LineChart({
  series,
  width = 600,
  height = 220,
  yFormatter = (v: number) => v.toFixed(0),
  xLabels = [],
}: {
  series: LineSeries[];
  width?: number;
  height?: number;
  yFormatter?: (v: number) => string;
  xLabels?: string[];
}) {
  const pad = { t: 16, r: 16, b: 24, l: 44 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const allY = series.flatMap((s) => s.values.filter((v): v is number => v != null));
  const min = Math.min(...allY, 0);
  const max = Math.max(...allY, 1);
  const range = max - min || 1;
  const n = series[0]?.values.length ?? 0;
  const step = w / (n - 1 || 1);
  const sx = (i: number) => pad.l + i * step;
  const sy = (v: number) => pad.t + h - ((v - min) / range) * h;
  const ticks = Array.from({ length: 5 }, (_, i) => min + (range * i) / 4);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      {ticks.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={width - pad.r} y1={sy(v).toFixed(1)} y2={sy(v).toFixed(1)} stroke="var(--grid-line)" />
          <text x={pad.l - 6} y={sy(v).toFixed(1)} textAnchor="end" dominantBaseline="central" fill="var(--fg-3)" fontSize={10} fontFamily="var(--font-mono)">
            {yFormatter(v)}
          </text>
        </g>
      ))}
      {xLabels.map((lbl, i) =>
        n > 12 && i % Math.ceil(n / 8) !== 0 ? null : (
          <text key={i} x={sx(i).toFixed(1)} y={height - pad.b + 14} textAnchor="middle" fill="var(--fg-3)" fontSize={10} fontFamily="var(--font-mono)">
            {lbl}
          </text>
        ),
      )}
      {series.map((s, si) => {
        const color = s.color ?? 'var(--accent)';
        const segs: string[] = [];
        s.values.forEach((v, i) => {
          if (v == null) return;
          segs.push(`${segs.length === 0 ? 'M' : 'L'} ${sx(i).toFixed(1)},${sy(v).toFixed(1)}`);
        });
        return <path key={si} d={segs.join(' ')} fill="none" stroke={color} strokeWidth={s.strokeWidth ?? 1.75} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? '4 4' : undefined} />;
      })}
    </svg>
  );
}

export function DonutChart({
  values,
  colors,
  size = 150,
  thickness = 24,
  centerValue,
  centerLabel,
}: {
  values: number[];
  colors: string[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
}) {
  const r = size / 2;
  const inner = r - thickness;
  const total = values.reduce((a, b) => a + b, 0) || 1;
  let angle = -Math.PI / 2;
  const arcs = values.map((v, i) => {
    const slice = (v / total) * Math.PI * 2;
    const a0 = angle;
    const a1 = angle + slice;
    angle = a1;
    const large = slice > Math.PI ? 1 : 0;
    const d = `M ${r + r * Math.cos(a0)} ${r + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${r + r * Math.cos(a1)} ${r + r * Math.sin(a1)} L ${r + inner * Math.cos(a1)} ${r + inner * Math.sin(a1)} A ${inner} ${inner} 0 ${large} 0 ${r + inner * Math.cos(a0)} ${r + inner * Math.sin(a0)} Z`;
    return <path key={i} d={d} fill={colors[i % colors.length]} />;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {arcs}
      {centerValue && (
        <text x={r} y={r - 6} textAnchor="middle" fontFamily="var(--font-display)" fontSize={20} fontWeight={600} fill="var(--fg-1)">
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text x={r} y={r + 12} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={10} fill="var(--fg-3)">
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

export function BarChart({
  values,
  width = 600,
  height = 180,
  color = 'var(--accent)',
  yFormatter = (v: number) => v.toFixed(0),
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  yFormatter?: (v: number) => string;
}) {
  const pad = { t: 12, r: 12, b: 22, l: 40 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const max = Math.max(...values, 1);
  const n = values.length || 1;
  const barW = (w / n) * 0.7;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad.t + h - t * h;
        return (
          <g key={i}>
            <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke="var(--grid-line)" />
            <text x={pad.l - 6} y={y} textAnchor="end" dominantBaseline="central" fill="var(--fg-3)" fontSize={10} fontFamily="var(--font-mono)">
              {yFormatter(max * t)}
            </text>
          </g>
        );
      })}
      {values.map((v, i) => {
        const bh = (v / max) * h;
        return <rect key={i} x={(pad.l + i * (w / n) + (w / n) * 0.15).toFixed(1)} y={(pad.t + h - bh).toFixed(1)} width={barW.toFixed(1)} height={bh.toFixed(1)} fill={color} rx={2} opacity={0.85} />;
      })}
    </svg>
  );
}
