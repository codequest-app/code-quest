import type { ChatProvider, OrchestratorStatus, SubTask } from '@code-quest/shared';
import { chatProviderSchema } from '@code-quest/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const dispatchFormSchema = z.object({
  tasks: z
    .array(
      z.object({
        description: z.string().min(1, 'Description is required'),
        provider: chatProviderSchema,
      }),
    )
    .min(1),
});

type DispatchFormValues = z.infer<typeof dispatchFormSchema>;

interface DispatchFormProps {
  status: OrchestratorStatus;
  onDispatch: (tasks: SubTask[]) => void;
  onSynthesize: () => void;
  onAbort: () => void;
}

export function DispatchForm({ status, onDispatch, onSynthesize, onAbort }: DispatchFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<DispatchFormValues>({
    resolver: zodResolver(dispatchFormSchema),
    defaultValues: {
      tasks: [{ description: '', provider: 'claude' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'tasks' });

  const tasks = watch('tasks');
  const canDispatch = status === 'idle' && tasks.some((t) => t.description.trim());
  const canSynthesize = status === 'workers-complete';
  const canAbort =
    status === 'dispatching' || status === 'workers-running' || status === 'synthesizing';

  const onSubmit = (data: DispatchFormValues) => {
    const nonEmpty = data.tasks.filter((t) => t.description.trim());
    if (nonEmpty.length === 0) return;
    onDispatch(
      nonEmpty.map((t) => ({
        description: t.description.trim(),
        provider: t.provider as ChatProvider,
      })),
    );
  };

  return (
    <div className="dispatch-form" data-testid="dispatch-form">
      {status === 'idle' && (
        <form onSubmit={handleSubmit(onSubmit)}>
          {fields.map((field, index) => (
            <div key={field.id}>
              <div className="task-row" data-testid="task-row">
                <input
                  type="text"
                  placeholder="Task description..."
                  aria-label={`Task ${index + 1} description`}
                  {...register(`tasks.${index}.description`)}
                  className={`task-input${errors.tasks?.[index]?.description ? ' task-input-error' : ''}`}
                />
                <select
                  aria-label={`Task ${index + 1} provider`}
                  {...register(`tasks.${index}.provider`)}
                  className="task-provider"
                >
                  <option value="claude">Claude</option>
                  <option value="gemini">Gemini</option>
                </select>
                {fields.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove task ${index + 1}`}
                    className="remove-task-btn"
                    onClick={() => remove(index)}
                  >
                    {'\u00D7'}
                  </button>
                )}
              </div>
              {errors.tasks?.[index]?.description && (
                <div className="task-error" data-testid="task-error">
                  {errors.tasks[index].description.message}
                </div>
              )}
            </div>
          ))}

          <div className="dispatch-actions">
            <button
              type="button"
              className="add-task-btn"
              onClick={() => append({ description: '', provider: 'claude' })}
              aria-label="Add task"
            >
              + Add Task
            </button>
            <button
              type="submit"
              className="dispatch-btn"
              disabled={!canDispatch}
              aria-label="Dispatch all"
            >
              Dispatch All
            </button>
          </div>
        </form>
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
        .task-input-error {
          border-color: #ff4444;
        }
        .task-error {
          color: #ff4444;
          font-size: 11px;
          margin: -4px 0 8px 0;
          padding-left: 2px;
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
