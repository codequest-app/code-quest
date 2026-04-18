/**
 * Shared Storybook decorator for components that need Channel context.
 * Builds sub-provider tree directly — ChannelProvider not used (no initialState needed).
 */
import { useRef } from 'react';
import { ChannelComposeProvider } from '../contexts/channel/ChannelComposeContext';
import type { ConfigState } from '../contexts/channel/ChannelConfigContext';
import { ChannelConfigProvider } from '../contexts/channel/ChannelConfigContext';
import { ChannelControlProvider } from '../contexts/channel/ChannelControlContext';
import { ChannelIdProvider } from '../contexts/channel/ChannelIdContext';
import { ChannelMessagesProvider } from '../contexts/channel/ChannelMessagesContext';
import { ChannelSocketRouterProvider } from '../contexts/channel/ChannelSocketRouterContext';
import { MessageVisibilityProvider } from '../contexts/channel/MessageVisibilityContext';
import { PluginProvider } from '../contexts/PluginContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { WorktreeProvider } from '../contexts/WorktreeContext';
import { createSocket } from '../socket/client';
import type { ChannelState } from '../types/chat';

const STORY_CHANNEL_ID = 'story';

interface StoryChannelOptions {
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
            <ProjectProvider>
              <WorktreeProvider>
                <TabProvider>
                  <div className={options?.className ?? 'max-w-3xl bg-bg text-text p-6 relative'}>
                    <Story />
                  </div>
                </TabProvider>
              </WorktreeProvider>
            </ProjectProvider>
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
            <ProjectProvider>
              <WorktreeProvider>
                <TabProvider>
                  <StoryProviders config={options?.config} messages={options?.messages}>
                    <div className={options?.className ?? 'max-w-3xl bg-bg text-text p-6 relative'}>
                      <Story />
                    </div>
                  </StoryProviders>
                </TabProvider>
              </WorktreeProvider>
            </ProjectProvider>
          </PluginProvider>
        </SessionProvider>
      </SocketProvider>
    );
  };
}

/** Compose‑able decorators for integration‑style stories. Wrap with what you need. */
export function withProject(Story: () => React.ReactNode) {
  return (
    <ProjectProvider>
      <Story />
    </ProjectProvider>
  );
}

export function withWorktree(Story: () => React.ReactNode) {
  return (
    <WorktreeProvider>
      <Story />
    </WorktreeProvider>
  );
}

export function withChannelSocketRouter(Story: () => React.ReactNode) {
  return (
    <ChannelIdProvider channelId={STORY_CHANNEL_ID}>
      <ChannelSocketRouterProvider>
        <Story />
      </ChannelSocketRouterProvider>
    </ChannelIdProvider>
  );
}

export function withMessageVisibility(Story: () => React.ReactNode) {
  return (
    <MessageVisibilityProvider>
      <Story />
    </MessageVisibilityProvider>
  );
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
    <ChannelIdProvider channelId={STORY_CHANNEL_ID}>
      <ChannelSocketRouterProvider>
        <ChannelMessagesProvider
          initialState={messages}
          dequeueMessage={() => messageQueueRef.current.shift()}
          messageQueueRef={messageQueueRef}
          resetStreamingRefsRef={resetStreamingRefsRef}
        >
          <ChannelControlProvider resetStreamingRefs={() => resetStreamingRefsRef.current()}>
            <ChannelConfigProvider initialConfig={config}>
              <MessageVisibilityProvider>
                <ChannelComposeProvider>{children}</ChannelComposeProvider>
              </MessageVisibilityProvider>
            </ChannelConfigProvider>
          </ChannelControlProvider>
        </ChannelMessagesProvider>
      </ChannelSocketRouterProvider>
    </ChannelIdProvider>
  );
}
