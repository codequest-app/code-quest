import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ToolUseBlock } from '../ToolUseBlock';

describe('ToolUseBlock', () => {
  it('should render tool name', () => {
    render(<ToolUseBlock name="Read" input={{ file_path: 'test.ts' }} />);

    expect(screen.getByTestId('tool-use-block')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('should be collapsed by default', () => {
    render(<ToolUseBlock name="Read" input={{ file_path: 'test.ts' }} />);

    expect(screen.queryByText(/"file_path"/)).not.toBeInTheDocument();
  });

  it('should expand to show JSON input when clicked', () => {
    render(<ToolUseBlock name="Read" input={{ file_path: 'test.ts' }} />);

    fireEvent.click(screen.getByText('Read'));

    expect(screen.getByText(/"file_path": "test.ts"/)).toBeInTheDocument();
  });

  it('should collapse again when clicked twice', () => {
    render(<ToolUseBlock name="Read" input={{ key: 'value' }} />);

    fireEvent.click(screen.getByText('Read'));
    expect(screen.getByText(/"key": "value"/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Read'));
    expect(screen.queryByText(/"key": "value"/)).not.toBeInTheDocument();
  });

  it('should have correct aria-expanded state', () => {
    render(<ToolUseBlock name="Bash" input={{}} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });
});
