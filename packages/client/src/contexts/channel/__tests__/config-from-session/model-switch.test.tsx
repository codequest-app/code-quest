import { segments as s } from '@code-quest/summoner/test';
import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '@/test/fake-summoner';
import { renderWithWorkspace } from '@/test/render-with-workspace';

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
    const listbox = await screen.findByRole('listbox');
    expect(within(listbox).getByText('Opus 4.6')).toBeInTheDocument();

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
