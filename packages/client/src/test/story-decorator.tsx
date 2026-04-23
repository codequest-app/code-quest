/**
 * Shared Storybook decorator for components that need Channel context.
 * Builds sub-provider tree directly — ChannelProvider not used (no initialState needed).
 */

import type { EffectiveColorTheme } from '@code-quest/shared';
import { useLayoutEffect, useRef } from 'react';
import { AppReadinessProvider } from '../contexts/AppReadinessContext';
import { ChannelComposeProvider } from '../contexts/channel/ChannelComposeContext';
import type { ConfigState } from '../contexts/channel/ChannelConfigContext';
import { ChannelConfigProvider } from '../contexts/channel/ChannelConfigContext';
import { ChannelControlProvider } from '../contexts/channel/ChannelControlContext';
import { ChannelIdProvider } from '../contexts/channel/ChannelIdContext';
import { ChannelMessagesProvider } from '../contexts/channel/ChannelMessagesContext';
import { ChannelSocketRouterProvider } from '../contexts/channel/ChannelSocketRouterContext';
import { MessageVisibilityProvider } from '../contexts/channel/MessageVisibilityContext';
import { NavigationProvider } from '../contexts/NavigationContext';
import { PluginProvider } from '../contexts/PluginContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { SessionProvider } from '../contexts/SessionContext';
import { SocketProvider } from '../contexts/SocketContext';
import { TabProvider } from '../contexts/TabContext';
import { WorktreeProvider } from '../contexts/WorktreeContext';
import { createSocket } from '../socket/client';
import type { Density } from '../stores/usePreferencesStore';
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
        <AppReadinessProvider>
          <SessionProvider>
            <PluginProvider>
              <ProjectProvider>
                <NavigationProvider>
                  <WorktreeProvider>
                    <TabProvider>
                      <div
                        className={options?.className ?? 'max-w-3xl bg-bg text-text p-6 relative'}
                      >
                        <Story />
                      </div>
                    </TabProvider>
                  </WorktreeProvider>
                </NavigationProvider>
              </ProjectProvider>
            </PluginProvider>
          </SessionProvider>
        </AppReadinessProvider>
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
        <AppReadinessProvider>
          <SessionProvider>
            <PluginProvider>
              <ProjectProvider>
                <NavigationProvider>
                  <WorktreeProvider>
                    <TabProvider>
                      <StoryProviders config={options?.config} messages={options?.messages}>
                        <div
                          className={options?.className ?? 'max-w-3xl bg-bg text-text p-6 relative'}
                        >
                          <Story />
                        </div>
                      </StoryProviders>
                    </TabProvider>
                  </WorktreeProvider>
                </NavigationProvider>
              </ProjectProvider>
            </PluginProvider>
          </SessionProvider>
        </AppReadinessProvider>
      </SocketProvider>
    );
  };
}

/** Applies theme/density data-attrs to <html> for the duration of a story.
 *  Useful for previewing palette variants per story without changing app state. */
export function withThemePreset({
  theme,
  density,
}: {
  theme?: EffectiveColorTheme;
  density?: Density;
} = {}) {
  return (Story: () => React.ReactNode) => (
    <ThemePresetWrapper theme={theme} density={density}>
      <Story />
    </ThemePresetWrapper>
  );
}

function ThemePresetWrapper({
  theme,
  density,
  children,
}: {
  theme?: EffectiveColorTheme;
  density?: Density;
  children: React.ReactNode;
}) {
  // Use useLayoutEffect so the data-attr is applied before the browser paints,
  // which matters for Storybook play functions that read computed style right
  // after render.
  useLayoutEffect(() => {
    const ds = document.documentElement.dataset;
    const prevTheme = ds.theme;
    const prevDensity = ds.density;
    if (theme) ds.theme = theme;
    if (density) ds.density = density;
    return () => {
      if (prevTheme === undefined) delete ds.theme;
      else ds.theme = prevTheme;
      if (prevDensity === undefined) delete ds.density;
      else ds.density = prevDensity;
    };
  }, [theme, density]);
  return <>{children}</>;
}

/** Compose‑able decorators for integration‑style stories. Wrap with what you need. */
export function withProject(Story: () => React.ReactNode) {
  return (
    <ProjectProvider>
      <NavigationProvider>
        <Story />
      </NavigationProvider>
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
