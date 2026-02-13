import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PermissionPrompt } from '../PermissionPrompt';

describe('PermissionPrompt', () => {
  const defaultProps = {
    toolName: 'Read',
    description: 'Reading file: src/index.ts',
    onAllow: vi.fn(),
    onDeny: vi.fn(),
    onAlwaysAllow: vi.fn(),
  };

  function renderPrompt(props = {}) {
    return render(<PermissionPrompt {...defaultProps} {...props} />);
  }

  it('should display tool name', () => {
    renderPrompt();

    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('should display description', () => {
    renderPrompt();

    expect(screen.getByText('Reading file: src/index.ts')).toBeInTheDocument();
  });

  it('should not render description when empty', () => {
    renderPrompt({ description: '' });

    expect(screen.queryByText('Reading file:')).not.toBeInTheDocument();
  });

  it('should render all three action buttons', () => {
    renderPrompt();

    expect(screen.getByLabelText('Allow')).toBeInTheDocument();
    expect(screen.getByLabelText('Deny')).toBeInTheDocument();
    expect(screen.getByLabelText('Always Allow')).toBeInTheDocument();
  });

  it('should call onAllow when Allow clicked', () => {
    const onAllow = vi.fn();
    renderPrompt({ onAllow });

    fireEvent.click(screen.getByLabelText('Allow'));
    expect(onAllow).toHaveBeenCalledTimes(1);
  });

  it('should call onDeny when Deny clicked', () => {
    const onDeny = vi.fn();
    renderPrompt({ onDeny });

    fireEvent.click(screen.getByLabelText('Deny'));
    expect(onDeny).toHaveBeenCalledTimes(1);
  });

  it('should call onAlwaysAllow when Always Allow clicked', () => {
    const onAlwaysAllow = vi.fn();
    renderPrompt({ onAlwaysAllow });

    fireEvent.click(screen.getByLabelText('Always Allow'));
    expect(onAlwaysAllow).toHaveBeenCalledTimes(1);
  });

  it('should show header text', () => {
    renderPrompt();

    expect(screen.getByText('Tool Permission Request')).toBeInTheDocument();
  });
});
