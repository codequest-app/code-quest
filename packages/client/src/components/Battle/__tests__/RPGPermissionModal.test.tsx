import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RPGPermissionModal } from '../RPGPermissionModal';

describe('RPGPermissionModal', () => {
  const defaultProps = {
    toolName: 'Bash',
    description: 'Execute a shell command',
    riskLevel: 'high' as const,
    onAllow: vi.fn(),
    onDeny: vi.fn(),
  };

  it('renders trap detection message', () => {
    render(<RPGPermissionModal {...defaultProps} />);
    expect(screen.getByText('罠を発見！')).toBeInTheDocument();
  });

  it('shows tool name', () => {
    render(<RPGPermissionModal {...defaultProps} />);
    expect(screen.getByText(/Bash/)).toBeInTheDocument();
  });

  it('shows risk level indicator', () => {
    render(<RPGPermissionModal {...defaultProps} />);
    expect(screen.getByTestId('risk-indicator')).toHaveTextContent(/高/);
  });

  it('shows low risk for read tools', () => {
    render(<RPGPermissionModal {...defaultProps} toolName="Read" riskLevel="low" />);
    expect(screen.getByTestId('risk-indicator')).toHaveTextContent(/低/);
  });

  it('calls onAllow when allow is selected', () => {
    const onAllow = vi.fn();
    render(<RPGPermissionModal {...defaultProps} onAllow={onAllow} />);
    fireEvent.click(screen.getByTestId('allow-button'));
    expect(onAllow).toHaveBeenCalled();
  });

  it('calls onDeny when deny is selected', () => {
    const onDeny = vi.fn();
    render(<RPGPermissionModal {...defaultProps} onDeny={onDeny} />);
    fireEvent.click(screen.getByTestId('deny-button'));
    expect(onDeny).toHaveBeenCalled();
  });
});
