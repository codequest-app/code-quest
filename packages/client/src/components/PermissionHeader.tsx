export function PermissionHeader({
  toolName,
  input,
  onInputChange,
}: {
  toolName?: string;
  input: Record<string, unknown>;
  onInputChange?: (updated: Record<string, unknown>) => void;
}) {
  switch (toolName) {
    case 'Bash': {
      const command = String(input.command ?? '');
      if (!command) return <p className="text-sm font-semibold">Bash</p>;
      const description = input.description as string | undefined;
      return (
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold">Allow this bash command?</p>
          <div
            className="text-xs bg-black/20 rounded p-2 overflow-auto max-h-32 font-mono focus:outline-none focus:ring-1 focus:ring-accent/50"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onInput={(e) => {
              const text = (e.target as HTMLDivElement).textContent ?? '';
              onInputChange?.({ ...input, command: text });
            }}
          >
            {command}
          </div>
          {description && <p className="text-xs text-text-muted/70">{description}</p>}
        </div>
      );
    }
    case 'Read': {
      const basename =
        String(input.file_path ?? '')
          .split('/')
          .pop() || 'file';
      return (
        <p className="text-sm font-semibold">
          Allow reading from <span className="font-mono text-accent">{basename}</span>?
        </p>
      );
    }
    case 'Write':
    case 'Edit':
    case 'MultiEdit': {
      const basename =
        String(input.file_path ?? '')
          .split('/')
          .pop() || 'file';
      return (
        <p className="text-sm font-semibold">
          Allow writing to <span className="font-mono text-accent">{basename}</span>?
        </p>
      );
    }
    default:
      return <p className="text-sm font-semibold">{toolName ?? 'Permission request'}</p>;
  }
}
