import { darkStyles, JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

interface JsonViewerProps {
  data: unknown;
  className?: string;
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  if (typeof data !== 'object' || data === null) {
    return <div className={className}>{String(data)}</div>;
  }

  return (
    <div className={className}>
      <JsonView data={data} style={darkStyles} />
    </div>
  );
}
