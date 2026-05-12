import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ContentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error rendering content:', error, info);
  }
  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="text-xs text-danger bg-danger-bg rounded px-3 py-2 border border-danger/20">
          Error rendering content: {this.state.error?.message ?? 'Unknown'}
        </div>
      );
    }
    return this.props.children;
  }
}
