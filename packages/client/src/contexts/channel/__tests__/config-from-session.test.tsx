import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '@/test/fake-summoner';
import { emitAssistantTurn, sendUserMessage } from '@/test/helpers';
import { renderWithChannel } from '@/test/render-with-channel';
import { renderWithWorkspace } from '@/test/render-with-workspace';
import { useChannelConfig } from '../index';

function ProviderConfigDisplay() {
  const { providerConfig } = useChannelConfig();
  if (!providerConfig) return <div data-testid="no-provider-config">none</div>;
  return <div data-testid="provider-brand">{providerConfig.brand.name}</div>;
}

describe('ChannelConfigContext', () => {
  it('providerConfig available on mount via app:config', async () => {
    await renderWithChannel(<ProviderConfigDisplay />);

    expect(await screen.findByTestId('provider-brand')).toHaveTextContent('Claude');
  });

  it('receives config from session:init on launch', async () => {
    const summoner = createFakeSummoner();
    summoner.claude().prepareInit(
      s.init('sess-1', {
        model: 'claude-sonnet-4-6',
        tools: ['Read', 'Write'],
        permissionMode: 'default',
        fastModeState: 'off',
        slashCommands: ['commit', 'review'],
        mcpServers: [{ name: 'github', status: 'connected' }],
      }),
    );
    await renderWithWorkspace({ summoner });

    expect(screen.getByText('Ask before edits')).toBeInTheDocument();
  });

  it('session:init model inherits supportsFastMode from defaultModels', async () => {
    const summoner = createFakeSummoner();
    // 'default' model is in adapter's defaultModels with supportsFastMode: true
    // No controlResponse with models — simulates app:models arriving later
    summoner.claude().prepareInit(s.init('sess-fast', { model: 'default' }));
    const { user } = await renderWithWorkspace({ summoner });

    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, '/');
    expect(await screen.findByText('Toggle fast mode')).toBeInTheDocument();
  });

  it('session:init with unknown model still shows fastMode after app:models arrives', async () => {
    const summoner = createFakeSummoner();
    // 'claude-opus-4-6' not in defaultModels — relies on app:models from controlResponse
    summoner.claude().prepareInit(
      s.init('sess-opus', { model: 'claude-opus-4-6' }),
      s.controlResponse('init', {
        models: [
          { value: 'default', displayName: 'Default', supportsFastMode: true },
          { value: 'claude-opus-4-6', displayName: 'Opus', supportsFastMode: true },
        ],
      }),
    );
    const { user } = await renderWithWorkspace({ summoner });

    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, '/');
    expect(await screen.findByText('Toggle fast mode')).toBeInTheDocument();
  });

  it('fastMode works with real CLI model ID "claude-opus-4-6[1m]" (shorthand-only models)', async () => {
    const summoner = createFakeSummoner();
    // Real CLI: session:init has model "claude-opus-4-6[1m]"
    // But initialize response models only have "default" (shorthand), not "claude-opus-4-6"
    // CommandMenu falls back to models[0] (default) which has supportsFastMode: true
    summoner.claude().prepareInit(
      s.init('sess-real', { model: 'claude-opus-4-6[1m]' }),
      s.controlResponse('init', {
        models: [
          { value: 'default', displayName: 'Default (recommended)', supportsFastMode: true },
          { value: 'sonnet', displayName: 'Sonnet' },
          { value: 'haiku', displayName: 'Haiku' },
        ],
      }),
    );
    const { user } = await renderWithWorkspace({ summoner });

    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, '/');
    expect(await screen.findByText('Toggle fast mode')).toBeInTheDocument();
  });

  it('updates config when CLI sends status with permissionMode', async () => {
    const { claude, user } = await renderWithWorkspace();
    await sendUserMessage(user);
    await emitAssistantTurn(claude);

    await act(async () => {
      await claude.emit(s.status({ permissionMode: 'plan' }));
    });

    expect(screen.getByText('Plan mode')).toBeInTheDocument();
  });
});
