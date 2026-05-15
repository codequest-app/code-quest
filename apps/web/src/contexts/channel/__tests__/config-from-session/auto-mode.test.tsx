import { segments as s } from '@code-quest/test-kit';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createFakeSummoner } from '@/test/fake-summoner';
import { renderWithWorkspace } from '@/test/render-with-workspace';

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

  it('Auto mode is visible when supportsAutoMode=true', async () => {
    const { user } = await setupWithAutoMode(true);
    await user.click(screen.getByRole('button', { name: /ask before edits/i }));
    expect(await screen.findByText('Auto mode')).toBeInTheDocument();
  });

  it('Auto mode is not visible when supportsAutoMode=false', async () => {
    const { user } = await setupWithAutoMode(false);
    await user.click(screen.getByRole('button', { name: /ask before edits/i }));
    expect(screen.queryByText('Auto mode')).not.toBeInTheDocument();
  });

  it('PermissionModePicker effort cycles through xhigh when model supports it', async () => {
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
});
