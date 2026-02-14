import type { SubTask } from '@code-quest/shared';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskPlanner } from '../TaskPlanner.tsx';

function renderTaskPlanner(onDispatch = vi.fn(), initialTasks?: SubTask[]) {
  return {
    ...render(<TaskPlanner onDispatch={onDispatch} initialTasks={initialTasks} />),
    onDispatch,
  };
}

describe('TaskPlanner', () => {
  it('should render with one empty task row by default', () => {
    renderTaskPlanner();
    expect(screen.getByLabelText('Task 1 description')).toBeInTheDocument();
    expect(screen.getByLabelText('Task 1 provider')).toBeInTheDocument();
  });

  it('should add a new task row when clicking "Add Task"', async () => {
    const user = userEvent.setup();
    renderTaskPlanner();

    await user.click(screen.getByRole('button', { name: /add task/i }));

    expect(screen.getByLabelText('Task 1 description')).toBeInTheDocument();
    expect(screen.getByLabelText('Task 2 description')).toBeInTheDocument();
  });

  it('should remove a task row when clicking remove (only if > 1 task)', async () => {
    const user = userEvent.setup();
    renderTaskPlanner();

    // Add second task
    await user.click(screen.getByRole('button', { name: /add task/i }));
    expect(screen.getByLabelText('Task 2 description')).toBeInTheDocument();

    // Remove first task
    await user.click(screen.getByLabelText('Remove task 1'));
    expect(screen.queryByLabelText('Task 2 description')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Task 1 description')).toBeInTheDocument();
  });

  it('should not show remove button when only one task', () => {
    renderTaskPlanner();
    expect(screen.queryByLabelText(/remove task/i)).not.toBeInTheDocument();
  });

  it('should dispatch tasks with valid descriptions', async () => {
    const user = userEvent.setup();
    const onDispatch = vi.fn();
    renderTaskPlanner(onDispatch);

    await user.type(screen.getByLabelText('Task 1 description'), 'Write tests');
    await user.click(screen.getByRole('button', { name: /dispatch/i }));

    await waitFor(() => {
      expect(onDispatch).toHaveBeenCalledWith([{ description: 'Write tests', provider: 'claude' }]);
    });
  });

  it('should dispatch multiple tasks', async () => {
    const user = userEvent.setup();
    const onDispatch = vi.fn();
    renderTaskPlanner(onDispatch);

    await user.type(screen.getByLabelText('Task 1 description'), 'Task A');
    await user.click(screen.getByRole('button', { name: /add task/i }));
    await user.type(screen.getByLabelText('Task 2 description'), 'Task B');
    await user.click(screen.getByRole('button', { name: /dispatch/i }));

    await waitFor(() => {
      expect(onDispatch).toHaveBeenCalledWith([
        { description: 'Task A', provider: 'claude' },
        { description: 'Task B', provider: 'claude' },
      ]);
    });
  });

  it('should allow changing provider', async () => {
    const user = userEvent.setup();
    const onDispatch = vi.fn();
    renderTaskPlanner(onDispatch);

    await user.type(screen.getByLabelText('Task 1 description'), 'Gemini task');
    await user.selectOptions(screen.getByLabelText('Task 1 provider'), 'gemini');
    await user.click(screen.getByRole('button', { name: /dispatch/i }));

    await waitFor(() => {
      expect(onDispatch).toHaveBeenCalledWith([{ description: 'Gemini task', provider: 'gemini' }]);
    });
  });

  it('should not dispatch when all tasks are empty', async () => {
    const user = userEvent.setup();
    const onDispatch = vi.fn();
    renderTaskPlanner(onDispatch);

    await user.click(screen.getByRole('button', { name: /dispatch/i }));

    await waitFor(() => {
      expect(onDispatch).not.toHaveBeenCalled();
    });
  });

  it('should show validation error for empty task among non-empty', async () => {
    const user = userEvent.setup();
    renderTaskPlanner();

    // Add a second task, fill only the second one
    await user.click(screen.getByRole('button', { name: /add task/i }));
    await user.type(screen.getByLabelText('Task 2 description'), 'Valid task');
    // Task 1 is empty but button is enabled because task 2 is valid
    await user.click(screen.getByRole('button', { name: /dispatch/i }));

    await waitFor(() => {
      expect(screen.getByTestId('task-error')).toBeInTheDocument();
    });
  });

  it('should show task count in dispatch button', async () => {
    const user = userEvent.setup();
    renderTaskPlanner();

    await user.type(screen.getByLabelText('Task 1 description'), 'Task A');
    await user.click(screen.getByRole('button', { name: /add task/i }));
    await user.type(screen.getByLabelText('Task 2 description'), 'Task B');

    // Button should reflect count
    expect(screen.getByRole('button', { name: /dispatch/i })).toBeInTheDocument();
  });

  it('should disable dispatch button when no descriptions filled', () => {
    renderTaskPlanner();
    expect(screen.getByRole('button', { name: /dispatch/i })).toBeDisabled();
  });

  it('should prefill tasks when initialTasks is provided', () => {
    const initialTasks: SubTask[] = [
      { description: 'Refactor auth module', provider: 'claude' },
      { description: 'Add JWT validation', provider: 'gemini' },
    ];
    renderTaskPlanner(vi.fn(), initialTasks);

    expect(screen.getByLabelText('Task 1 description')).toHaveValue('Refactor auth module');
    expect(screen.getByLabelText('Task 1 provider')).toHaveValue('claude');
    expect(screen.getByLabelText('Task 2 description')).toHaveValue('Add JWT validation');
    expect(screen.getByLabelText('Task 2 provider')).toHaveValue('gemini');
  });

  it('should allow editing prefilled tasks', async () => {
    const user = userEvent.setup();
    const initialTasks: SubTask[] = [{ description: 'Original task', provider: 'claude' }];
    renderTaskPlanner(vi.fn(), initialTasks);

    const input = screen.getByLabelText('Task 1 description');
    await user.clear(input);
    await user.type(input, 'Updated task');
    expect(input).toHaveValue('Updated task');
  });

  it('should display dependency labels when initialTasks contain dependsOn', () => {
    const initialTasks: SubTask[] = [
      { description: 'Setup DB', provider: 'claude' },
      { description: 'Build API', provider: 'claude', dependsOn: [0] },
    ];
    renderTaskPlanner(vi.fn(), initialTasks);

    expect(screen.getByTestId('task-2-depends')).toHaveTextContent('depends on #1');
  });

  it('should dispatch tasks with dependsOn', async () => {
    const user = userEvent.setup();
    const onDispatch = vi.fn();
    const initialTasks: SubTask[] = [
      { description: 'Setup DB', provider: 'claude' },
      { description: 'Build API', provider: 'claude', dependsOn: [0] },
    ];
    renderTaskPlanner(onDispatch, initialTasks);

    await user.click(screen.getByRole('button', { name: /dispatch/i }));

    await waitFor(() => {
      expect(onDispatch).toHaveBeenCalledWith([
        { description: 'Setup DB', provider: 'claude' },
        { description: 'Build API', provider: 'claude', dependsOn: [0] },
      ]);
    });
  });

  it('should dispatch prefilled tasks', async () => {
    const user = userEvent.setup();
    const onDispatch = vi.fn();
    const initialTasks: SubTask[] = [
      { description: 'Task A', provider: 'claude' },
      { description: 'Task B', provider: 'gemini' },
    ];
    renderTaskPlanner(onDispatch, initialTasks);

    await user.click(screen.getByRole('button', { name: /dispatch/i }));

    await waitFor(() => {
      expect(onDispatch).toHaveBeenCalledWith([
        { description: 'Task A', provider: 'claude' },
        { description: 'Task B', provider: 'gemini' },
      ]);
    });
  });
});
