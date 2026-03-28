import { darkStyles, JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

interface JsonViewerProps {
  data: unknown;
  className?: string;
}

export function JsonViewer({ data, className }: JsonViewerProps) {
  return (
    <div className={className}>
      <JsonView data={data as object} style={darkStyles} />
    </div>
  );
}
