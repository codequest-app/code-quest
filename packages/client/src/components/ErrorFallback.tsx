interface ErrorFallbackProps {
  error: unknown;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <span className="text-4xl">⚠</span>
      <h2 className="text-lg font-semibold text-text-bright">Something went wrong</h2>
      <p className="text-sm text-text-muted max-w-md">{message}</p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
