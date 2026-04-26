import { segments as s } from '@code-quest/summoner/test';
import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '@/test/fake-summoner';
import { emitAssistantTurn, sendUserMessage } from '@/test/helpers';
import { renderWithChannel } from '@/test/render-with-channel';
import { renderWithWorkspace } from '@/test/render-with-workspace';
import { useChannelConfig } from '../../index';

function ProviderConfigDisplay() {
  const { providerConfig } = useChannelConfig();
  if (!providerConfig)
    return (
      <div role="status" aria-label="provider-config">
        none
      </div>
    );
  return (
    <div role="status" aria-label="provider-brand">
      {providerConfig.brand.name}
    </div>
  );
}

describe('ChannelConfigContext', () => {
  it('providerConfig available on mount via app:config', async () => {
    await renderWithChannel(<ProviderConfigDisplay />);

    expect(await screen.findByRole('status', { name: 'provider-brand' })).toHaveTextContent(
      'Claude',
    );
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
    const { addProject } = await renderWithWorkspace({ summoner });
    const project = await addProject();
    await project.launchSession();

    expect(screen.getByText('Ask before edits')).toBeInTheDocument();
  });

  it('session:init model inherits supportsFastMode from defaultModels', async () => {
    const summoner = createFakeSummoner();
    // 'default' model is in adapter's defaultModels with supportsFastMode: true
    // No controlResponse with models — simulates app:models arriving later
    summoner.claude().prepareInit(s.init('sess-fast', { model: 'default' }));
    const { user, addProject } = await renderWithWorkspace({ summoner });
    const project = await addProject();
    await project.launchSession();

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
    const { user, addProject } = await renderWithWorkspace({ summoner });
    const project = await addProject();
    await project.launchSession();

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
    const { user, addProject } = await renderWithWorkspace({ summoner });
    const project = await addProject();
    await project.launchSession();

    const textarea = screen.getByPlaceholderText(/Esc to focus/i);
    await user.click(textarea);
    await user.type(textarea, '/');
    expect(await screen.findByText('Toggle fast mode')).toBeInTheDocument();
  });

  it('clicking Plan mode in PermissionModePicker sends set_permission_mode to CLI', async () => {
    const summoner = createFakeSummoner();
    summoner.claude().prepareInit(s.init('sess-1', { permissionMode: 'normal' }));
    const { claude, user, addProject } = await renderWithWorkspace({ summoner });
    const project = await addProject();
    await project.launchSession();

    await user.click(screen.getByRole('button', { name: /ask before edits/i }));
    await user.click(await screen.findByText('Plan mode'));

    expect(claude.received('control_request').at(-1)).toMatchObject({
      request: { subtype: 'set_permission_mode', mode: 'plan' },
    });
  });

  it('clicking Auto mode in PermissionModePicker sends set_permission_mode auto to CLI', async () => {
    const MODEL_ID = 'claude-sonnet-4-6';
    const summoner = createFakeSummoner();
    summoner.claude().prepareInit(
      s.init('sess-1', { model: MODEL_ID, permissionMode: 'normal' }),
      s.controlResponse('init', {
        models: [{ value: MODEL_ID, displayName: 'Sonnet 4.6', supportsAutoMode: true }],
      }),
    );
    const { claude, user, addProject } = await renderWithWorkspace({ summoner });
    const project = await addProject();
    await project.launchSession();

    await user.click(screen.getByRole('button', { name: /ask before edits/i }));
    await user.click(await screen.findByText('Auto mode'));

    expect(claude.received('control_request').at(-1)).toMatchObject({
      request: { subtype: 'set_permission_mode', mode: 'auto' },
    });
  });

  it('updates config when CLI sends status with permissionMode', async () => {
    const { claude, user, addProject } = await renderWithWorkspace();
    const project = await addProject();
    await project.launchSession();
    await sendUserMessage(user);
    await emitAssistantTurn(claude);

    await act(async () => {
      await claude.emit(s.status({ permissionMode: 'plan' }));
    });

    expect(screen.getByText('Plan mode')).toBeInTheDocument();
  });

  it('updates thinkingLevel when settings:update event arrives', async () => {
    function ThinkingLevelDisplay() {
      const { thinkingLevel } = useChannelConfig();
      return (
        <div role="status" aria-label="thinking-level">
          {thinkingLevel ?? 'off'}
        </div>
      );
    }

    const { claude, channelId } = await renderWithChannel(<ThinkingLevelDisplay />);

    expect(screen.getByRole('status', { name: 'thinking-level' })).toHaveTextContent('off');

    await act(async () => {
      claude.pushServerEvent('settings:update', { channelId, thinkingLevel: 'default_on' });
    });

    expect(screen.getByRole('status', { name: 'thinking-level' })).toHaveTextContent('default_on');
  });
});
