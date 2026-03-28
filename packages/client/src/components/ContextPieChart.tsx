export function ContextPieChart({ pct }: { pct: number }) {
  const size = 12;
  const r = size / 2;
  const angle = (pct / 100) * 360;
  const rad = (angle - 90) * (Math.PI / 180);
  const x = r + r * Math.cos(rad);
  const y = r + r * Math.sin(rad);
  const largeArc = angle > 180 ? 1 : 0;
  const usedPath = pct === 0 ? '' : `M ${r} ${r} L ${r} 0 A ${r} ${r} 0 ${largeArc} 1 ${x} ${y} Z`;

  return (
    <svg
      role="img"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Context: ${pct}% used`}
    >
      <circle cx={r} cy={r} r={r} fill="currentColor" opacity="0.2" />
      {usedPath && <path d={usedPath} fill="currentColor" />}
    </svg>
  );
}
