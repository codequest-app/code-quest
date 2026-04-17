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

  describe('model switch updates local model info', () => {
    it('effortLevels updates when CLI pushes app:models after model switch', async () => {
      // Model A: 5 levels (has xhigh). Model B: 4 levels (no xhigh).
      // Start on A. Cycle to 'high' (3 steps from max). Switch to B.
      // One more cycle: with B's 4-level list → next is 'max', NOT 'xhigh'.
      // Without the fix (app:models overwrites to empty shells → fallback 5 levels) → next would be 'xhigh'.
      const MODEL_A = 'claude-opus-4-6';
      const MODEL_B = 'claude-haiku-4-5';
      const summoner = createFakeSummoner();
      summoner.claude().prepareInit(
        s.init('sess-1', { model: MODEL_A }),
        s.controlResponse('init', {
          models: [
            {
              value: MODEL_A,
              displayName: 'Opus',
              supportsEffort: true,
              supportedEffortLevels: ['low', 'medium', 'high', 'xhigh', 'max'],
            },
            {
              value: MODEL_B,
              displayName: 'Haiku',
              supportsEffort: true,
              supportedEffortLevels: ['low', 'medium', 'high', 'max'],
            },
          ],
        }),
      );
      const { claude, user, addProject } = await renderWithWorkspace({ summoner });
      const project = await addProject();
      const channelId = await project.launchSession();

      // Open picker and get effort cycle button (default effort = max)
      await user.click(screen.getByRole('button', { name: /ask before edits/i }));
      const effortButton = await screen.findByTitle('Click to cycle effort level');

      // Cycle 3 times on Model A: max → low → medium → high
      await user.click(effortButton); // low
      await user.click(effortButton); // medium
      await user.click(effortButton); // high

      // Switch to Model B — app:models sends string-only list
      await act(async () => {
        claude.pushServerEvent('settings:update', { channelId, modelSetting: MODEL_B });
        claude.pushServerEvent('app:models', { channelId: '', models: [MODEL_A, MODEL_B] });
      });

      // One more cycle from 'high':
      // Model B (4 levels): high → max  ← correct
      // Broken (5 levels fallback): high → xhigh  ← bug
      await user.click(effortButton);
      expect(screen.queryByText(/extra high/i)).not.toBeInTheDocument();
    });

    it('ModelPickerPanel shows correct displayName after model switch', async () => {
      const MODEL_A = 'claude-opus-4-6';
      const MODEL_B = 'claude-haiku-4-5';
      const summoner = createFakeSummoner();
      summoner.claude().prepareInit(
        s.init('sess-1', { model: MODEL_A }),
        s.controlResponse('init', {
          models: [
            { value: MODEL_A, displayName: 'Opus 4.6' },
            { value: MODEL_B, displayName: 'Haiku 4.5' },
          ],
        }),
      );
      const { user, addProject } = await renderWithWorkspace({ summoner });
      const project = await addProject();
      await project.launchSession();

      // Open model picker — slash command triggers it
      const textarea = screen.getByPlaceholderText(/Esc to focus/i);
      await user.click(textarea);
      await user.type(textarea, '/');
      await user.click(await screen.findByText(/switch model/i));

      // Opus 4.6 should be selected
      expect(await screen.findByText('Opus 4.6')).toBeInTheDocument();

      // Click Haiku 4.5 — calls setModel immediately (optimistic update, no server round-trip)
      await user.click(await screen.findByText('Haiku 4.5'));

      // Re-open model picker — Haiku 4.5 should now be shown as selected
      await user.click(textarea);
      await user.type(textarea, '/');
      await user.click(await screen.findByText(/switch model/i));

      expect((await screen.findAllByText('Haiku 4.5')).length).toBeGreaterThan(0);
    });

    it('supportsAutoMode updates when model switches via app:models', async () => {
      const MODEL_A = 'claude-opus-4-6';
      const MODEL_B = 'claude-haiku-4-5';
      const summoner = createFakeSummoner();
      summoner.claude().prepareInit(
        s.init('sess-1', { model: MODEL_A }),
        s.controlResponse('init', {
          models: [
            { value: MODEL_A, displayName: 'Opus', supportsAutoMode: true },
            { value: MODEL_B, displayName: 'Haiku', supportsAutoMode: false },
          ],
        }),
      );
      const { claude, user, addProject } = await renderWithWorkspace({ summoner });
      const project = await addProject();
      const channelId = await project.launchSession();

      // Model A supports auto mode — should show Auto mode in picker
      await user.click(screen.getByRole('button', { name: /ask before edits/i }));
      expect(await screen.findByText('Auto mode')).toBeInTheDocument();

      // Close picker by clicking somewhere outside, then switch to Model B
      await user.click(document.body);
      await act(async () => {
        claude.pushServerEvent('settings:update', { channelId, modelSetting: MODEL_B });
        claude.pushServerEvent('app:models', { channelId: '', models: [MODEL_A, MODEL_B] });
      });

      // Re-open picker — Auto mode should be gone
      await user.click(screen.getByRole('button', { name: /ask before edits/i }));
      expect(screen.queryByText('Auto mode')).not.toBeInTheDocument();
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
});
