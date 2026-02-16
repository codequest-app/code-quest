import type { ChatStreamEvent } from '@code-quest/shared';
import { generateEnemy, mapChatEvent } from '@code-quest/shared';
import { useEffect, useRef } from 'react';
import { useBattleStore } from '../stores/battleStore';
import { useChatStore } from '../stores/chatStore';

interface SessionTracking {
  lastMessageCount: number;
  lastToolUseCount: number;
  hadError: boolean;
}

/**
 * Subscribes to chatStore events for ALL chat sessions and drives battleStore via RPG event mapper.
 * Call once at the app level — tracks every session automatically.
 */
export function useBattleEngine(): void {
  const trackingRef = useRef(new Map<string, SessionTracking>());

  useEffect(() => {
    const unsubscribe = useChatStore.subscribe((state, prevState) => {
      for (const [sessionId, session] of state.chatSessions) {
        const prevSession = prevState.chatSessions.get(sessionId);
        if (session === prevSession) continue;

        const tracking = trackingRef.current.get(sessionId) ?? {
          lastMessageCount: 0,
          lastToolUseCount: 0,
          hadError: false,
        };

        const battleStore = useBattleStore.getState();

        // Detect new user message → start battle
        const userMessages = session.messages.filter((m) => m.role === 'user');
        if (userMessages.length > tracking.lastMessageCount) {
          tracking.lastMessageCount = userMessages.length;
          const latestUserMsg = userMessages[userMessages.length - 1];
          const prompt = latestUserMsg.content;
          battleStore.setPrompt(sessionId, prompt);

          const enemy = generateEnemy(prompt);
          battleStore.startBattle(sessionId, enemy);
          battleStore.processBattleEvent(sessionId, {
            type: 'battle_start',
            data: { enemy, prompt },
          });
          tracking.lastToolUseCount = 0;
          tracking.hadError = false;
        }

        const battle = useBattleStore.getState().getBattle(sessionId);
        if (!battle || battle.phase !== 'active') {
          trackingRef.current.set(sessionId, tracking);
          continue;
        }

        // Detect new tool_use events in the latest assistant message
        const lastMsg = session.messages[session.messages.length - 1];
        if (lastMsg?.role === 'assistant' && lastMsg.toolUse) {
          const currentToolCount = lastMsg.toolUse.length;
          if (currentToolCount > tracking.lastToolUseCount) {
            for (let i = tracking.lastToolUseCount; i < currentToolCount; i++) {
              const tool = lastMsg.toolUse[i];
              const event: ChatStreamEvent = {
                type: 'tool_use',
                data: { id: tool.id, name: tool.name, input: tool.input },
              };
              const currentBattle = useBattleStore.getState().getBattle(sessionId);
              if (currentBattle && currentBattle.phase === 'active') {
                const battleEvents = mapChatEvent(event, currentBattle);
                for (const be of battleEvents) {
                  useBattleStore.getState().processBattleEvent(sessionId, be);
                }
              }
            }
            tracking.lastToolUseCount = currentToolCount;
          }
        }

        // Detect processing complete → victory or error counter
        if (!session.isProcessing && prevSession?.isProcessing) {
          const currentBattle = useBattleStore.getState().getBattle(sessionId);
          if (currentBattle && currentBattle.phase === 'active') {
            // Check for pending permission (denied tool = error scenario)
            if (session.pendingPermission) {
              const errorEvent: ChatStreamEvent = {
                type: 'error',
                data: { message: `${session.pendingPermission.toolName} was denied` },
              };
              const battleEvents = mapChatEvent(errorEvent, currentBattle);
              for (const be of battleEvents) {
                useBattleStore.getState().processBattleEvent(sessionId, be);
              }
            } else {
              // Normal completion → victory
              const resultEvent: ChatStreamEvent = {
                type: 'result',
                data: { stats: {} },
              };
              if (lastMsg?.role === 'assistant' && lastMsg.stats) {
                resultEvent.data.stats = lastMsg.stats;
              }
              const battleEvents = mapChatEvent(resultEvent, currentBattle);
              for (const be of battleEvents) {
                useBattleStore.getState().processBattleEvent(sessionId, be);
              }
            }
            tracking.lastToolUseCount = 0;
          }
        }

        trackingRef.current.set(sessionId, tracking);
      }

      // Clean up tracking for removed sessions
      for (const sessionId of trackingRef.current.keys()) {
        if (!state.chatSessions.has(sessionId)) {
          trackingRef.current.delete(sessionId);
        }
      }
    });

    return () => {
      unsubscribe();
      trackingRef.current.clear();
    };
  }, []);
}
