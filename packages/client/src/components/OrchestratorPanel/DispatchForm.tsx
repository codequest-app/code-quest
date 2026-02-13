import type { ChatProvider, OrchestratorStatus, SubTask } from '@code-quest/shared';
import { useRef, useState } from 'react';

interface DispatchFormProps {
  status: OrchestratorStatus;
  onDispatch: (tasks: SubTask[]) => void;
  onSynthesize: () => void;
  onAbort: () => void;
}

interface TaskWithKey extends SubTask {
  _key: number;
}

export function DispatchForm({ status, onDispatch, onSynthesize, onAbort }: DispatchFormProps) {
  const nextKey = useRef(1);
  const [tasks, setTasks] = useState<TaskWithKey[]>([
    { description: '', provider: 'claude', _key: 0 },
  ]);

  const addTask = () => {
    setTasks([...tasks, { description: '', provider: 'claude', _key: nextKey.current++ }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: keyof SubTask, value: string) => {
    const updated = [...tasks];
    if (field === 'provider') {
      updated[index] = { ...updated[index], provider: value as ChatProvider };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setTasks(updated);
  };

  const handleDispatch = () => {
    const validTasks = tasks.filter((t) => t.description.trim()).map(({ _key, ...task }) => task);
    if (validTasks.length === 0) return;
    onDispatch(validTasks);
  };

  const canDispatch = status === 'idle' && tasks.some((t) => t.description.trim());
  const canSynthesize = status === 'workers-complete';
  const canAbort =
    status === 'dispatching' || status === 'workers-running' || status === 'synthesizing';

  return (
    <div className="dispatch-form" data-testid="dispatch-form">
      {status === 'idle' && (
        <>
          {tasks.map((task, index) => (
            <div key={task._key} className="task-row" data-testid="task-row">
              <input
                type="text"
                placeholder="Task description..."
                aria-label={`Task ${index + 1} description`}
                value={task.description}
                onChange={(e) => updateTask(index, 'description', e.target.value)}
                className="task-input"
              />
              <select
                aria-label={`Task ${index + 1} provider`}
                value={task.provider}
                onChange={(e) => updateTask(index, 'provider', e.target.value)}
                className="task-provider"
              >
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
              </select>
              {tasks.length > 1 && (
                <button
                  type="button"
                  aria-label={`Remove task ${index + 1}`}
                  className="remove-task-btn"
                  onClick={() => removeTask(index)}
                >
                  \u00D7
                </button>
              )}
            </div>
          ))}

          <div className="dispatch-actions">
            <button type="button" className="add-task-btn" onClick={addTask} aria-label="Add task">
              + Add Task
            </button>
            <button
              type="button"
              className="dispatch-btn"
              onClick={handleDispatch}
              disabled={!canDispatch}
              aria-label="Dispatch all"
            >
              Dispatch All
            </button>
          </div>
        </>
      )}

      {canSynthesize && (
        <div className="dispatch-actions">
          <button
            type="button"
            className="synthesize-btn"
            onClick={onSynthesize}
            aria-label="Synthesize"
          >
            Synthesize Results
          </button>
        </div>
      )}

      {canAbort && (
        <div className="dispatch-actions">
          <button type="button" className="abort-btn" onClick={onAbort} aria-label="Abort">
            Abort
          </button>
        </div>
      )}

      <style>{`
        .dispatch-form {
          padding: 12px;
          border-top: 1px solid #3e3e42;
        }
        .task-row {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
        }
        .task-input {
          flex: 1;
          padding: 6px 10px;
          background: #3c3c3c;
          border: 1px solid #555;
          border-radius: 4px;
          color: #d4d4d4;
          font-size: 13px;
        }
        .task-input:focus {
          outline: none;
          border-color: #3794ff;
        }
        .task-provider {
          padding: 6px 8px;
          background: #3c3c3c;
          border: 1px solid #555;
          border-radius: 4px;
          color: #d4d4d4;
          font-size: 13px;
        }
        .remove-task-btn {
          padding: 4px 8px;
          background: transparent;
          border: none;
          color: #ff4444;
          cursor: pointer;
          font-size: 18px;
        }
        .dispatch-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .add-task-btn, .dispatch-btn, .synthesize-btn, .abort-btn {
          padding: 6px 14px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }
        .add-task-btn {
          background: #3c3c3c;
          color: #d4d4d4;
        }
        .dispatch-btn {
          background: #0e639c;
          color: white;
        }
        .dispatch-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .synthesize-btn {
          background: #0dbc79;
          color: white;
        }
        .abort-btn {
          background: #ff4444;
          color: white;
        }
      `}</style>
    </div>
  );
}
