/**
 * Shared Storybook decorator for components that need Channel context.
 * Builds sub-provider tree directly — ChannelProvider not used (no initialState needed).
 */
import { useRef } from 'react';
import { ChannelComposeProvider } from '../contexts/channel/ChannelComposeContext';
import type { ConfigState } from '../contexts/channel/ChannelConfigContext';
import { ChannelConfigProvider } from '../contexts/channel/ChannelConfigContext';
import { ChannelControlProvider } from '../contexts/channel/ChannelControlContext';
import { ChannelMessagesProvider } from '../contexts/channel/ChannelMessagesContext';
import { PluginProvider } from '../contexts/PluginContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { createSocket } from '../socket/client';
import type { ChannelState } from '../types/chat';

const STORY_CHANNEL_ID = 'story';

export interface StoryChannelOptions {
  /** Override ChannelConfigProvider initial config (model, tools, permissionMode, etc.) */
  config?: Partial<ConfigState>;
  /** Override ChannelMessagesProvider initial state (messages, status, etc.) */
  messages?: Partial<ChannelState>;
  /** Wrapper className for story content */
  className?: string;
}

/** App-level providers only (Socket, Session, Plugin, Tab). No Channel context. */
export function withStoryApp(options?: { className?: string }) {
  return (Story: () => React.ReactNode) => {
    const socket = createSocket();
    return (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <div className={options?.className ?? 'max-w-3xl bg-bg text-text p-6 relative'}>
                <Story />
              </div>
            </TabProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>
    );
  };
}

/** App + Channel providers with optional initial config/messages state. */
export function withStoryChannel(options?: StoryChannelOptions) {
  return (Story: () => React.ReactNode) => {
    const socket = createSocket();
    return (
      <SocketProvider socket={socket}>
        <SessionProvider>
          <PluginProvider>
            <TabProvider>
              <StoryProviders config={options?.config} messages={options?.messages}>
                <div className={options?.className ?? 'max-w-3xl bg-bg text-text p-6 relative'}>
                  <Story />
                </div>
              </StoryProviders>
            </TabProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>
    );
  };
}

function StoryProviders({
  config,
  messages,
  children,
}: {
  config?: Partial<ConfigState>;
  messages?: Partial<ChannelState>;
  children: React.ReactNode;
}) {
  const resetStreamingRefsRef = useRef(() => {});
  const messageQueueRef = useRef<string[]>([]);

  return (
    <ChannelMessagesProvider
      channelId={STORY_CHANNEL_ID}
      initialState={messages}
      dequeueMessage={() => messageQueueRef.current.shift()}
      messageQueueRef={messageQueueRef}
      resetStreamingRefsRef={resetStreamingRefsRef}
    >
      <ChannelControlProvider
        channelId={STORY_CHANNEL_ID}
        resetStreamingRefs={() => resetStreamingRefsRef.current()}
      >
        <ChannelConfigProvider channelId={STORY_CHANNEL_ID} initialConfig={config}>
          <ChannelComposeProvider channelId={STORY_CHANNEL_ID}>{children}</ChannelComposeProvider>
        </ChannelConfigProvider>
      </ChannelControlProvider>
    </ChannelMessagesProvider>
  );
}
