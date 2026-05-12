export function ToolUseHeader({
  icon,
  name,
  detail,
  range,
  badge,
}: {
  icon: React.ReactNode;
  name: string;
  detail?: string;
  range?: string;
  badge?: React.ReactNode;
}): React.JSX.Element {
  return (
    <>
      <span className="inline-flex items-center">{icon}</span>
      <span className="font-semibold text-text-bright">{name}</span>
      {detail && <span className="opacity-70 truncate max-w-75">{detail}</span>}
      {range && <span className="opacity-50 text-xs">{range}</span>}
      {badge}
    </>
  );
}
