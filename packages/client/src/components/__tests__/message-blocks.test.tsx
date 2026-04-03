import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderBody } from '../MessageContent';

describe('message-blocks', () => {
  describe('ToolUseBlock (via renderBody)', () => {
    it('renders tool_use with tool name', () => {
      render(
        <>
          {renderBody({
            id: '1',
            role: 'assistant',
            type: 'tool_use',
            content: 'Bash',
            timestamp: Date.now(),
            meta: { toolId: 'tu-1', input: { command: 'ls -la' } },
          })}
        </>,
      );
      expect(screen.getByText('Bash')).toBeInTheDocument();
    });

    it('hides tool_use for hidden tools (TodoRead)', () => {
      const { container } = render(
        <>
          {renderBody({
            id: '1',
            role: 'assistant',
            type: 'tool_use',
            content: 'TodoRead',
            timestamp: Date.now(),
            meta: { toolId: 'tu-2', input: {} },
          })}
        </>,
      );
      expect(container.innerHTML).toBe('');
    });
  });

  describe('ToolResultBlock (via renderBody)', () => {
    it('renders tool_result with label', () => {
      render(
        <>
          {renderBody({
            id: '1',
            role: 'assistant',
            type: 'tool_result',
            content: 'file contents here',
            timestamp: Date.now(),
            meta: { toolId: 'tu-1', name: 'Read' },
          })}
        </>,
      );
      expect(screen.getByText('Result: Read')).toBeInTheDocument();
    });
  });

  describe('SystemBlocks (via renderBody)', () => {
    it('renders error message', () => {
      render(
        <>
          {renderBody({
            id: '1',
            role: 'system',
            type: 'error',
            content: 'Something went wrong',
            timestamp: Date.now(),
          })}
        </>,
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders result stats', () => {
      render(
        <>
          {renderBody({
            id: '1',
            role: 'system',
            type: 'result',
            content: '',
            timestamp: Date.now(),
            meta: {
              stats: {
                costUsd: 0.05,
                durationMs: 3000,
                inputTokens: 100,
                outputTokens: 50,
                numTurns: 1,
              },
            },
          })}
        </>,
      );
      expect(screen.getByText('$0.0500')).toBeInTheDocument();
      expect(screen.getByText('1 turns')).toBeInTheDocument();
    });

    it('renders compact boundary', () => {
      render(
        <>
          {renderBody({
            id: '1',
            role: 'system',
            type: 'compact_boundary',
            content: '',
            timestamp: Date.now(),
          })}
        </>,
      );
      expect(screen.getByText('Context was compressed')).toBeInTheDocument();
    });

    it('renders control response with approved style', () => {
      render(
        <>
          {renderBody({
            id: '1',
            role: 'user',
            type: 'action_result',
            content: 'Approved: Bash',
            timestamp: Date.now(),
          })}
        </>,
      );
      expect(screen.getByText(/Approved: Bash/)).toBeInTheDocument();
    });
  });

  describe('HookBlocks (via renderBody)', () => {
    it('renders hook_started', () => {
      render(
        <>
          {renderBody({
            id: '1',
            role: 'system',
            type: 'hook_started',
            content: 'pre-commit',
            timestamp: Date.now(),
          })}
        </>,
      );
      expect(screen.getByText(/Running hook: pre-commit/)).toBeInTheDocument();
    });
  });

  describe('Other blocks (via renderBody)', () => {
    it('renders text with markdown', () => {
      render(
        <>
          {renderBody({
            id: '1',
            role: 'assistant',
            type: 'text',
            content: 'Hello **world**',
            timestamp: Date.now(),
          })}
        </>,
      );
      expect(screen.getByText('world')).toBeInTheDocument();
    });

    it('renders interrupt', () => {
      render(
        <>
          {renderBody({
            id: '1',
            role: 'system',
            type: 'interrupt',
            content: '',
            timestamp: Date.now(),
          })}
        </>,
      );
      expect(screen.getByText('Interrupted by user')).toBeInTheDocument();
    });
  });
});
