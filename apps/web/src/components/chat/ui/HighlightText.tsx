export function HighlightText({
  text,
  query,
  highlightClassName = 'bg-accent/30 text-inherit rounded-sm',
  as: As = 'mark',
}: {
  text: string;
  query?: string;
  highlightClassName?: string;
  as?: 'mark' | 'span';
}): React.ReactNode {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <As className={highlightClassName}>{text.slice(idx, idx + query.length)}</As>
      {text.slice(idx + query.length)}
    </>
  );
}
