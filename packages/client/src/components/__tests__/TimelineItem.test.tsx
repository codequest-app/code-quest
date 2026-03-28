import { segments as s } from '@code-quest/summoner/test';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithWorkspace } from '../../test/render-with-workspace';
import { TimelineItem } from '../TimelineItem';

describe('Conversation display — tool use timeline', () => {
  it('renders tool name after pipeline event', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'read the file');
    await user.keyboard('{Enter}');
    await claude.emit(
      s.assistant({
        toolUse: { id: 'toolu_1', name: 'Read', input: { file_path: 'src/app.ts' } },
      }),
    );
    await claude.emit(s.toolResult('toolu_1', 'file content here'));
    await claude.emit(s.assistant('Done reading'));
    await claude.emit(s.result());

    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getByText('app.ts')).toBeInTheDocument();
  });

  it('shows Bash tool name in DOM', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'list files');
    await user.keyboard('{Enter}');
    await claude.emit(
      s.assistant({ toolUse: { id: 'toolu_1', name: 'Bash', input: { command: 'ls -la' } } }),
    );
    await claude.emit(s.toolResult('toolu_1', 'total 42\ndrwxr-xr-x'));
    await claude.emit(s.result());

    expect(screen.getByText('Bash')).toBeInTheDocument();
  });

  it('renders thinking message as collapsible block', async () => {
    const { claude, user } = await renderWithWorkspace();
    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, 'think about this');
    await user.keyboard('{Enter}');
    await claude.emit(s.thinking('Let me analyze this...'));
    await claude.emit(s.assistant('Here is my answer'));
    await claude.emit(s.result());

    // Thinking label visible
    expect(screen.getByText('Thinking')).toBeInTheDocument();
    // Content in DOM (collapsed by default)
    expect(screen.getByText('Let me analyze this...')).toBeInTheDocument();

    // Click to toggle (use fireEvent to bypass pointer-events check)
    await act(async () => {
      screen.getByText('Thinking').click();
    });
    expect(screen.getByText('Let me analyze this...')).toBeInTheDocument();
  });
});

// ── Copy button & labels (merged from TimelineItem.unit.test.tsx) ──

describe('TimelineItem unit', () => {
  describe('copy button', () => {
    beforeEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
        configurable: true,
      });
    });

    it('renders copy button when input is present and expanded', async () => {
      render(<TimelineItem toolName="Bash" description="ls" input="ls -la" output="total 42" />);
      await userEvent.click(screen.getByRole('button', { name: /Bash/ }));
      expect(screen.getByTitle('Copy input')).toBeInTheDocument();
    });

    it('copy button calls clipboard.writeText with input content', async () => {
      render(<TimelineItem toolName="Bash" description="ls" input="ls -la" output="" />);
      await userEvent.click(screen.getByRole('button', { name: /Bash/ }));
      await userEvent.click(screen.getByTitle('Copy input'));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ls -la');
    });

    it('does not render copy button when input is empty', async () => {
      render(<TimelineItem toolName="Read" description="file" input="" output="content" />);
      await userEvent.click(screen.getByRole('button', { name: /Read/ }));
      expect(screen.queryByTitle('Copy input')).not.toBeInTheDocument();
    });
  });

  describe('IN/OUT labels', () => {
    it('shows IN label when expanded and input is present', async () => {
      render(<TimelineItem toolName="Bash" description="cmd" input="echo hi" output="hi" />);
      await userEvent.click(screen.getByRole('button', { name: /Bash/ }));
      expect(screen.getByText('IN')).toBeInTheDocument();
    });

    it('shows OUT label when expanded and output is present', async () => {
      render(<TimelineItem toolName="Bash" description="cmd" input="echo hi" output="hi" />);
      await userEvent.click(screen.getByRole('button', { name: /Bash/ }));
      expect(screen.getByText('OUT')).toBeInTheDocument();
    });
  });
});
