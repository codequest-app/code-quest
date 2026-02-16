import type { SubTask } from '@code-quest/shared';
import { useEffect, useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { useChatStore } from '../../stores/chatStore.ts';
import { ChatPanel } from '../ChatPanel/ChatPanel.tsx';
import { parseTasksFromMessage } from './parseTasksFromMessage.ts';
import { TaskPlanner } from './TaskPlanner.tsx';
import { TASK_GENERATION_PROMPT } from './taskGenerationPrompt.ts';

type PlannerState = 'chat' | 'generating' | 'planning';

interface PlanningViewProps {
  coordinatorId: string;
  onSend: (sessionId: string, message: string) => void;
  onAbort: (sessionId: string) => void;
  onDispatch: (tasks: SubTask[]) => void;
}

export function PlanningView({ coordinatorId, onSend, onAbort, onDispatch }: PlanningViewProps) {
  const [plannerState, setPlannerState] = useState<PlannerState>('chat');
  const [generatedTasks, setGeneratedTasks] = useState<SubTask[]>([]);

  const isProcessing = useChatStore(
    (state) => state.getChatSession(coordinatorId)?.isProcessing ?? false,
  );

  const handlePlanTasks = () => {
    onSend(coordinatorId, TASK_GENERATION_PROMPT);
    setPlannerState('generating');
  };

  const handleRegenerate = () => {
    onSend(coordinatorId, TASK_GENERATION_PROMPT);
    setGeneratedTasks([]);
    setPlannerState('generating');
  };

  const handleBackToChat = () => {
    setGeneratedTasks([]);
    setPlannerState('chat');
  };

  useEffect(() => {
    if (plannerState !== 'generating' || isProcessing) return;
    const session = useChatStore.getState().getChatSession(coordinatorId);
    const messages = session?.messages ?? [];
    const lastMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    const parsed = parseTasksFromMessage(lastMsg?.content ?? '');
    if (parsed) setGeneratedTasks(parsed);
    setPlannerState('planning');
  }, [plannerState, isProcessing, coordinatorId]);

  if (plannerState === 'planning') {
    return (
      <div className="planning-view" data-testid="planning-view">
        <div className="planning-view__split">
          <Group orientation="horizontal">
            <Panel defaultSize={50} minSize={30}>
              <ChatPanel sessionId={coordinatorId} onSend={onSend} onAbort={onAbort} />
            </Panel>
            <Separator className="resize-handle" />
            <Panel defaultSize={50} minSize={30}>
              <TaskPlanner
                onDispatch={onDispatch}
                initialTasks={generatedTasks.length > 0 ? generatedTasks : undefined}
              />
            </Panel>
          </Group>
        </div>
        <div className="planning-view__actions">
          <button type="button" className="btn btn--ghost" onClick={handleBackToChat}>
            ← Back to Chat
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleRegenerate}>
            ↻ Regenerate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="planning-view" data-testid="planning-view">
      <div className="planning-view__chat">
        <ChatPanel sessionId={coordinatorId} onSend={onSend} onAbort={onAbort} />
      </div>
      {plannerState === 'generating' ? (
        <div className="planning-view__generating" data-testid="generating-status">
          <button type="button" className="btn btn--primary" disabled>
            Generating...
          </button>
        </div>
      ) : (
        <div className="planning-view__actions">
          <button type="button" className="btn btn--primary" onClick={handlePlanTasks}>
            Plan Tasks
          </button>
        </div>
      )}
    </div>
  );
}
