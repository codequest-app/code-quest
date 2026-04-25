import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskChecklist } from '../TaskChecklist';

describe('TaskChecklist', () => {
  it('renders a checkbox per `- [ ]` / `- [x]` line with correct checked state', () => {
    const content = ['## Heading', '- [x] done', '- [ ] todo', '', '- [X] case-insensitive'].join(
      '\n',
    );
    render(
      <TaskChecklist content={content} onToggle={async () => ({ ok: true, checked: true })} />,
    );
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(boxes).toHaveLength(3);
    expect(boxes[0].checked).toBe(true);
    expect(boxes[1].checked).toBe(false);
    expect(boxes[2].checked).toBe(true);
  });

  it('non-task lines render as read-only text, no checkbox', () => {
    render(
      <TaskChecklist
        content={'## Heading\nplain text\n- [ ] todo\n'}
        onToggle={async () => ({ ok: true, checked: true })}
      />,
    );
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByText('## Heading')).toBeInTheDocument();
    expect(screen.getByText('plain text')).toBeInTheDocument();
  });

  it('clicking a checkbox optimistically flips and fires onToggle with absolute lineIndex', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn(async () => ({ ok: true as const, checked: true }));
    const content = ['## Heading', '- [ ] first', '- [ ] second'].join('\n');
    render(<TaskChecklist content={content} onToggle={onToggle} />);
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    await user.click(boxes[1]);
    expect(onToggle).toHaveBeenCalledWith(2); // lines: 0=heading, 1=first, 2=second
    expect(boxes[1].checked).toBe(true);
  });

  it('reverts optimistic flip + calls onError when RPC returns error', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn(async () => ({ error: 'write failed' }));
    const onError = vi.fn();
    render(<TaskChecklist content={'- [ ] only\n'} onToggle={onToggle} onError={onError} />);
    const box = screen.getByRole('checkbox') as HTMLInputElement;
    await user.click(box);
    expect(box.checked).toBe(false);
    expect(onError).toHaveBeenCalledWith('write failed');
  });

  it('re-parses when content prop changes (e.g. after refetch)', () => {
    const { rerender } = render(
      <TaskChecklist content={'- [ ] a\n'} onToggle={async () => ({ ok: true, checked: true })} />,
    );
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
    rerender(
      <TaskChecklist content={'- [x] a\n'} onToggle={async () => ({ ok: true, checked: true })} />,
    );
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
  });
});
