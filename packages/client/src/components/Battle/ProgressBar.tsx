interface ProgressBarProps {
  value: number;
  max: number;
  type: 'hp' | 'mp' | 'exp';
  className?: string;
}

function getBarColor(type: ProgressBarProps['type'], percent: number): string {
  if (type === 'mp') return '#42a5f5';
  if (type === 'exp') return '#ffd54f';
  // HP: green → yellow → red
  if (percent > 50) return '#66bb6a';
  if (percent > 25) return '#fdd835';
  return '#ef5350';
}

export function ProgressBar({ value, max, type, className = '' }: ProgressBarProps) {
  const percent = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const color = getBarColor(type, percent);

  return (
    <div className={`progress-bar ${className}`} data-testid={`progress-bar-${type}`}>
      <div
        className="progress-bar-fill"
        data-testid={`progress-fill-${type}`}
        style={{
          width: `${percent}%`,
          backgroundColor: color,
          transition: 'width 0.3s ease-out',
        }}
      />
    </div>
  );
}
