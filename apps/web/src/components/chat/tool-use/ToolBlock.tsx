export function ToolBlock({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-code-block overflow-hidden text-xs font-mono group/tool-block">
      {children}
    </div>
  );
}
