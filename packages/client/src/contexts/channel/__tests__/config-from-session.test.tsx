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

  describe('reload plugins hot reload', () => {
    function ReloadDisplay() {
      const { slashCommands, mcpServers } = useChannelConfig();
      return (
        <div>
          <div data-testid="slash-commands">{slashCommands.join(',')}</div>
          <div data-testid="mcp-servers">{mcpServers.map((m) => m.name).join(',')}</div>
        </div>
      );
    }

    it('updates slashCommands and mcpServers when server pushes plugin:reloaded', async () => {
      const summoner = createFakeSummoner();
      const { claude, channelId } = await renderWithChannel(<ReloadDisplay />, {
        summoner,
        initSegment: s.init('sess-reload', {
          slashCommands: ['old-skill'],
          mcpServers: [{ name: 'old-server', status: 'connected' }],
        }),
      });

      expect(screen.getByTestId('slash-commands')).toHaveTextContent('old-skill');

      await act(async () => {
        claude.pushServerEvent('plugin:reloaded', {
          channelId,
          commands: [{ name: 'new-skill', description: 'A new skill', argumentHint: '' }],
          mcpServers: [{ name: 'new-server', status: 'connected' }],
        });
      });

      expect(screen.getByTestId('slash-commands')).toHaveTextContent('new-skill');
      expect(screen.getByTestId('mcp-servers')).toHaveTextContent('new-server');
    });
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

  describe('auto mode visibility based on supportsAutoMode', () => {
    const MODEL_ID = 'claude-sonnet-4-6';

    async function setupWithAutoMode(supportsAutoMode: boolean) {
      const summoner = createFakeSummoner();
      summoner.claude().prepareInit(
        s.init('sess-1', { model: MODEL_ID, permissionMode: 'normal' }),
        s.controlResponse('init', {
          models: [{ value: MODEL_ID, displayName: 'Sonnet 4.6', supportsAutoMode }],
        }),
      );
      const { user, addProject } = await renderWithWorkspace({ summoner });
      const project = await addProject();
      await project.launchSession();
      return { user };
    }

    it('shows Auto mode in dropdown when model supports it', async () => {
      const { user } = await setupWithAutoMode(true);
      await user.click(screen.getByRole('button', { name: /ask before edits/i }));
      expect(await screen.findByText('Auto mode')).toBeInTheDocument();
    });

    it('hides Auto mode in dropdown when model does not support it', async () => {
      const { user } = await setupWithAutoMode(false);
      await user.click(screen.getByRole('button', { name: /ask before edits/i }));
      expect(screen.queryByText('Auto mode')).not.toBeInTheDocument();
    });
  });

  it('PermissionModePicker effort cycles through xhigh when model supports it', async () => {
    const MODEL_ID = 'claude-sonnet-4-6';
    const summoner = createFakeSummoner();
    summoner.claude().prepareInit(
      s.init('sess-1', { model: MODEL_ID, permissionMode: 'normal' }),
      s.controlResponse('init', {
        models: [
          {
            value: MODEL_ID,
            displayName: 'Sonnet 4.6',
            supportsEffort: true,
            supportedEffortLevels: ['low', 'medium', 'high', 'xhigh', 'max'],
          },
        ],
      }),
    );
    const { user, addProject } = await renderWithWorkspace({ summoner });
    const project = await addProject();
    await project.launchSession();

    await user.click(screen.getByRole('button', { name: /ask before edits/i }));
    const effortButton = await screen.findByTitle('Click to cycle effort level');
    // cycle from max (default) → low → medium → high → xhigh
    await user.click(effortButton); // → low
    await user.click(effortButton); // → medium
    await user.click(effortButton); // → high
    await user.click(effortButton); // → xhigh
    expect(screen.getByText(/extra high/i)).toBeInTheDocument();
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
});
