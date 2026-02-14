import type { ChatProvider, SubTask } from '@code-quest/shared';
import { chatProviderSchema } from '@code-quest/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const taskPlannerSchema = z.object({
  tasks: z
    .array(
      z.object({
        description: z.string().min(1, 'Description is required'),
        provider: chatProviderSchema,
        dependsOn: z.array(z.number()).optional(),
      }),
    )
    .min(1),
});

type TaskPlannerValues = z.infer<typeof taskPlannerSchema>;

interface TaskPlannerProps {
  onDispatch: (tasks: SubTask[]) => void;
  initialTasks?: SubTask[];
}

function formatDependsOn(deps: number[] | undefined): string {
  if (!deps || deps.length === 0) return '';
  return `depends on ${deps.map((d) => `#${d + 1}`).join(', ')}`;
}

export function TaskPlanner({ onDispatch, initialTasks }: TaskPlannerProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<TaskPlannerValues>({
    resolver: zodResolver(taskPlannerSchema),
    defaultValues: {
      tasks: initialTasks?.length
        ? initialTasks.map((t) => ({
            description: t.description,
            provider: t.provider,
            dependsOn: t.dependsOn,
          }))
        : [{ description: '', provider: 'claude' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'tasks' });
  const tasks = watch('tasks');
  const hasValidTask = tasks.some((t) => t.description.trim());

  const onSubmit = (data: TaskPlannerValues) => {
    const validTasks = data.tasks.filter((t) => t.description.trim());
    if (validTasks.length === 0) return;
    onDispatch(
      validTasks.map((t) => ({
        description: t.description.trim(),
        provider: t.provider as ChatProvider,
        ...(t.dependsOn && t.dependsOn.length > 0 ? { dependsOn: t.dependsOn } : {}),
      })),
    );
  };

  return (
    <div className="task-planner" data-testid="task-planner">
      <h2 className="task-planner__title">Plan Your Tasks</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="task-planner__list">
        {fields.map((field, index) => (
          <div key={field.id}>
            <div className="task-planner__row">
              <span className="task-planner__number">{index + 1}</span>
              <input
                type="text"
                placeholder="Task description..."
                aria-label={`Task ${index + 1} description`}
                {...register(`tasks.${index}.description`)}
                className={`task-planner__input${errors.tasks?.[index]?.description ? ' task-planner__input--error' : ''}`}
              />
              <select
                aria-label={`Task ${index + 1} provider`}
                {...register(`tasks.${index}.provider`)}
                className="task-planner__select"
              >
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
              </select>
              {fields.length > 1 && (
                <button
                  type="button"
                  className="task-planner__remove-btn"
                  aria-label={`Remove task ${index + 1}`}
                  onClick={() => remove(index)}
                >
                  {'\u00D7'}
                </button>
              )}
            </div>
            {tasks[index]?.dependsOn && tasks[index].dependsOn.length > 0 && (
              <div className="task-planner__depends" data-testid={`task-${index + 1}-depends`}>
                {formatDependsOn(tasks[index].dependsOn)}
              </div>
            )}
            {errors.tasks?.[index]?.description && (
              <div className="task-planner__error" data-testid="task-error">
                {errors.tasks[index].description.message}
              </div>
            )}
          </div>
        ))}

        <div className="task-planner__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => append({ description: '', provider: 'claude' })}
            aria-label="Add task"
          >
            + Add Task
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!hasValidTask}
            aria-label={`Dispatch ${tasks.filter((t) => t.description.trim()).length} tasks`}
          >
            {`Dispatch ${tasks.filter((t) => t.description.trim()).length || ''} Tasks`.trim()}
          </button>
        </div>
      </form>
    </div>
  );
}
