import { useEffect, useRef } from 'react';

interface StreamOutputProps {
  text?: string;
  error?: string;
}

export function StreamOutput({ text, error }: StreamOutputProps) {
  const containerRef = useRef<HTMLPreElement>(null);
  const shouldAutoScroll = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when content changes
  useEffect(() => {
    const el = containerRef.current;
    if (el && shouldAutoScroll.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [text, error]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (el) {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
      shouldAutoScroll.current = atBottom;
    }
  };

  if (error) {
    return (
      <pre
        ref={containerRef}
        className="stream-output"
        style={{ color: '#f44747' }}
        data-testid="stream-output"
      >
        {error}
      </pre>
    );
  }

  if (!text) {
    return (
      <div className="stream-output stream-output--empty" data-testid="stream-output">
        Waiting for output...
      </div>
    );
  }

  return (
    <pre
      ref={containerRef}
      className="stream-output"
      onScroll={handleScroll}
      data-testid="stream-output"
    >
      {text}
    </pre>
  );
}
