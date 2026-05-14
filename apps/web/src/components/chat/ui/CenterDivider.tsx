export function CenterDivider({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 py-2 text-dim text-xs" {...props}>
      <div className="flex-1 border-t border-text-muted/20" />
      {children}
      <div className="flex-1 border-t border-text-muted/20" />
    </div>
  );
}
