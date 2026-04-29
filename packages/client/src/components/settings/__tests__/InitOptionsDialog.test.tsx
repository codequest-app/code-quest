import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InitOptionsDialog } from '../InitOptionsDialog';

describe('InitOptionsDialog', () => {
  it('renders two textareas when open', () => {
    render(<InitOptionsDialog open={true} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByLabelText('System Prompt')).toBeInTheDocument();
    expect(screen.getByLabelText('Append System Prompt')).toBeInTheDocument();
  });

  it('calls onSave with values', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InitOptionsDialog open={true} onClose={vi.fn()} onSave={onSave} />);
    await user.type(screen.getByLabelText('System Prompt'), 'test');
    await user.click(screen.getByText('Save'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ systemPrompt: 'test' }));
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(<InitOptionsDialog open={true} onClose={onClose} onSave={vi.fn()} />);
    await userEvent.setup().keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    render(<InitOptionsDialog open={false} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.queryByLabelText('System Prompt')).not.toBeInTheDocument();
  });

  it('shows hint that settings take effect on next session', () => {
    render(<InitOptionsDialog open={true} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText(/takes effect.*next.*session/i)).toBeInTheDocument();
  });

  it('has advanced section with jsonSchema and agents fields (no sdkMcpServers)', async () => {
    const user = userEvent.setup();
    render(<InitOptionsDialog open={true} onClose={vi.fn()} onSave={vi.fn()} />);

    await user.click(screen.getByText('Advanced'));

    expect(screen.queryByLabelText('SDK MCP Servers')).not.toBeInTheDocument();
    expect(screen.getByLabelText('JSON Schema')).toBeInTheDocument();
    expect(screen.getByLabelText('Agents')).toBeInTheDocument();
  });

  it('saves advanced fields', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InitOptionsDialog open={true} onClose={vi.fn()} onSave={onSave} />);

    await user.click(screen.getByText('Advanced'));
    await user.click(screen.getByLabelText('JSON Schema'));
    await user.paste('{"type":"object"}');
    await user.click(screen.getByText('Save'));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ jsonSchema: '{"type":"object"}' }),
    );
  });

  describe('hooks config', () => {
    it('render hooks toggle checkboxes', async () => {
      const user = userEvent.setup();
      render(<InitOptionsDialog open={true} onClose={vi.fn()} onSave={vi.fn()} />);
      await user.click(screen.getByText('Advanced'));
      expect(screen.getByLabelText(/captureBaseline/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/saveFileIfNeeded/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/findDiagnosticsProblems/i)).toBeInTheDocument();
    });

    it('include enabled hooks in onSave callback', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(<InitOptionsDialog open={true} onClose={vi.fn()} onSave={onSave} />);
      await user.click(screen.getByText('Advanced'));
      await user.click(screen.getByLabelText(/captureBaseline/i));
      await user.click(screen.getByText('Save'));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          hooks: expect.objectContaining({
            PreToolUse: expect.arrayContaining([
              expect.objectContaining({ matcher: 'captureBaseline' }),
            ]),
          }),
        }),
      );
    });

    it('include multiple hooks from different categories', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(<InitOptionsDialog open={true} onClose={vi.fn()} onSave={onSave} />);
      await user.click(screen.getByText('Advanced'));
      await user.click(screen.getByLabelText(/captureBaseline/i));
      await user.click(screen.getByLabelText(/findDiagnosticsProblems/i));
      await user.click(screen.getByText('Save'));
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          hooks: {
            PreToolUse: [{ matcher: 'captureBaseline', hookCallbackIds: ['captureBaseline'] }],
            PostToolUse: [
              { matcher: 'findDiagnosticsProblems', hookCallbackIds: ['findDiagnosticsProblems'] },
            ],
          },
        }),
      );
    });

    it('not include hooks when none are checked', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      render(<InitOptionsDialog open={true} onClose={vi.fn()} onSave={onSave} />);
      await user.click(screen.getByText('Save'));
      const call = onSave.mock.calls[0]![0];
      expect(call.hooks).toBeUndefined();
    });
  });
});
