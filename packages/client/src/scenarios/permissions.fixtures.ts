import type { PendingControl } from '@code-quest/shared';
import { segments as s } from '@code-quest/summoner/test';
import { buildChannelState } from '../test/build-channel-state';
import type { Message } from '../types/ui';

export function toolApprovalFlow(): { messages: Message[]; pending: PendingControl[] } {
  const state = buildChannelState([
    s.user('Clean up the build artifacts'),
    s.assistant("I'll remove the build directory to start fresh."),
    s.controlRequestBash('req-1', {
      command: 'rm -rf /tmp/build',
      description: 'Clean build artifacts before rebuilding',
    }),
  ]);
  return {
    messages: (state.messages ?? []) as Message[],
    pending: [
      {
        requestId: 'req-1',
        subtype: 'can_use_tool',
        toolName: 'Bash',
        input: {
          command: 'rm -rf /tmp/build',
          description: 'Clean build artifacts before rebuilding',
        },
      },
    ],
  };
}

export function toolDenialFlow(): { messages: Message[]; pending: PendingControl[] } {
  const state = buildChannelState([
    s.user('Delete all log files'),
    s.assistant("I'll remove the log files."),
    s.controlRequestBash('req-deny', {
      command: 'rm -rf /var/log/app/*',
      description: 'Remove all application log files',
    }),
  ]);
  return {
    messages: (state.messages ?? []) as Message[],
    pending: [
      {
        requestId: 'req-deny',
        subtype: 'can_use_tool',
        toolName: 'Bash',
        input: {
          command: 'rm -rf /var/log/app/*',
          description: 'Remove all application log files',
        },
      },
    ],
  };
}

export function planReviewFlow(): { messages: Message[]; pending: PendingControl[] } {
  const state = buildChannelState([
    s.user('Refactor the auth module'),
    s.assistant(
      "Here's my plan:\n\n" +
        '1. Extract `validateUser` into its own module\n' +
        '2. Add proper error types\n' +
        '3. Update tests\n\n' +
        'Shall I proceed?',
    ),
    s.controlRequestExitPlanMode('req-plan', {}),
  ]);
  return {
    messages: (state.messages ?? []) as Message[],
    pending: [
      {
        requestId: 'req-plan',
        subtype: 'exit_plan_mode',
        toolName: 'ExitPlanMode',
        input: {},
      },
    ],
  };
}
