import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// JsonViewer doesn't exist yet — TDD red phase
import { JsonViewer } from '../JsonViewer';

describe('JsonViewer', () => {
  it('renders object properties', () => {
    render(<JsonViewer data={{ name: 'Alice', age: 30 }} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/30/)).toBeInTheDocument();
  });

  it('renders array items', () => {
    render(<JsonViewer data={[1, 2, 3]} />);
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });

  it('renders nested objects', () => {
    render(<JsonViewer data={{ user: { name: 'Bob' } }} />);
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
  });

  it('applies className to container', () => {
    const { container } = render(<JsonViewer data={{ x: 1 }} className="custom-class" />);
    expect(container.firstElementChild).toHaveClass('custom-class');
  });

  it('renders without className', () => {
    const { container } = render(<JsonViewer data={{ x: 1 }} />);
    expect(container.firstElementChild).toBeInTheDocument();
  });

  it('handles null values', () => {
    render(<JsonViewer data={{ key: null }} />);
    expect(screen.getByText(/null/)).toBeInTheDocument();
  });

  it('handles string values', () => {
    render(<JsonViewer data="hello" />);
    expect(screen.getByText(/hello/)).toBeInTheDocument();
  });
});
