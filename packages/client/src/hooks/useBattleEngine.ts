import type { ChatStreamEvent } from '@code-quest/shared';
import { generateEnemy, mapChatEvent } from '@code-quest/shared';
import { useEffect, useRef } from 'react';
import { useBattleStore } from '../stores/battleStore';
import { useChatStore } from '../stores/chatStore';

/**
 * Subscribes to chatStore events for a session and drives the battleStore via RPG event mapper.
 * Call once per active chat session.
 */
export function useBattleEngine(sessionId: string | null): void {
  const lastMessageCountRef = useRef(0);
  const lastToolUseCountRef = useRef(0);

  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to chatStore changes
    const unsubscribe = useChatStore.subscribe((state, prevState) => {
      const session = state.chatSessions.get(sessionId);
      const prevSession = prevState.chatSessions.get(sessionId);
      if (!session || session === prevSession) return;

      const battleStore = useBattleStore.getState();
      const battle = battleStore.getBattle(sessionId);

      // Detect new user message → start battle
      const userMessages = session.messages.filter((m) => m.role === 'user');
      if (userMessages.length > lastMessageCountRef.current) {
        lastMessageCountRef.current = userMessages.length;
        const latestUserMsg = userMessages[userMessages.length - 1];
        const prompt = latestUserMsg.content;
        battleStore.setPrompt(sessionId, prompt);

        const enemy = generateEnemy(prompt);
        battleStore.startBattle(sessionId, enemy);
        battleStore.processBattleEvent(sessionId, {
          type: 'battle_start',
          data: { enemy, prompt },
        });
        lastToolUseCountRef.current = 0;
      }

      if (!battle && !battleStore.getBattle(sessionId)) return;

      // Detect new tool_use events in the latest assistant message
      const lastMsg = session.messages[session.messages.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.toolUse) {
        const currentToolCount = lastMsg.toolUse.length;
        if (currentToolCount > lastToolUseCountRef.current) {
          // Process each new tool_use
          for (let i = lastToolUseCountRef.current; i < currentToolCount; i++) {
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
          lastToolUseCountRef.current = currentToolCount;
        }
      }

      // Detect result → victory
      if (!session.isProcessing && prevSession?.isProcessing) {
        const currentBattle = useBattleStore.getState().getBattle(sessionId);
        if (currentBattle && currentBattle.phase === 'active') {
          const resultEvent: ChatStreamEvent = {
            type: 'result',
            data: { stats: {} },
          };
          // Find actual stats from last assistant message
          if (lastMsg?.role === 'assistant' && lastMsg.stats) {
            resultEvent.data.stats = lastMsg.stats;
          }
          const battleEvents = mapChatEvent(resultEvent, currentBattle);
          for (const be of battleEvents) {
            useBattleStore.getState().processBattleEvent(sessionId, be);
          }
          lastToolUseCountRef.current = 0;
        }
      }

      // Detect error events
      const prevMsgCount = prevSession?.messages.length ?? 0;
      if (session.messages.length > prevMsgCount) {
        // Check if the chatStore just processed an error (isProcessing went false without result)
        // Errors are handled via the processing → not processing transition above
      }
    });

    return () => {
      unsubscribe();
      lastMessageCountRef.current = 0;
      lastToolUseCountRef.current = 0;
    };
  }, [sessionId]);
}
