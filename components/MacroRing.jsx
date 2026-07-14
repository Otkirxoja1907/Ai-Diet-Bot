const RINGS = [
  { key: "calories", color: "var(--ring-calories)", r: 84 },
  { key: "protein", color: "var(--ring-protein)", r: 68 },
  { key: "carbs", color: "var(--ring-carbs)", r: 52 },
  { key: "fat", color: "var(--ring-fat)", r: 36 },
];

/**
 * Concentric progress rings — the app's recurring signature motif.
 * values: { calories, protein, carbs, fat } as 0..1 fractions.
 */
export default function MacroRing({ values, size = 220, centerLabel, centerSub }) {
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Macro progress">
      {RINGS.map((ring) => {
        const frac = Math.min(1, Math.max(0, values[ring.key] ?? 0));
        const circumference = 2 * Math.PI * ring.r;
        const offset = circumference * (1 - frac);
        return (
          <g key={ring.key} transform={`translate(${cx},${cy}) rotate(-90)`}>
            <circle r={ring.r} fill="none" stroke="var(--color-line)" strokeWidth="8" />
            <circle
              r={ring.r}
              fill="none"
              stroke={ring.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.4,0,.2,1)" }}
            />
          </g>
        );
      })}
      {centerLabel && (
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize="28"
          fill="var(--color-ink)"
        >
          {centerLabel}
        </text>
      )}
      {centerSub && (
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          fontFamily="var(--font-body)"
          fontSize="11"
          fill="var(--color-ink-faint)"
          letterSpacing="0.05em"
        >
          {centerSub}
        </text>
      )}
    </svg>
  );
}
