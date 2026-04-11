/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import { createFakeSummoner } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeSummoner().claude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

describe('ChatHandler > plan', () => {
  it('plan:comment adds a comment and plan:comments retrieves it', async () => {
    const { claude, channelId } = await setup();

    const comment = {
      id: 'c1',
      selectedText: 'some text',
      sectionHeading: 'heading',
      comment: 'my note',
    };

    const addResult = await claude.send<{ success: boolean }>('plan:comment', {
      channelId,
      comment,
    });
    expect(addResult.success).toBe(true);

    const getResult = await claude.send<{ comments: any[] }>('plan:comments', { channelId });
    expect(getResult.comments).toHaveLength(1);
    expect(getResult.comments[0]).toMatchObject(comment);
  });

  it('plan:remove_comment removes a specific comment', async () => {
    const { claude, channelId } = await setup();

    await claude.send<any>('plan:comment', {
      channelId,
      comment: { id: 'c1', selectedText: 't1', sectionHeading: 'h1', comment: 'n1' },
    });
    await claude.send<any>('plan:comment', {
      channelId,
      comment: { id: 'c2', selectedText: 't2', sectionHeading: 'h2', comment: 'n2' },
    });

    const removeResult = await claude.send<{ success: boolean }>('plan:remove_comment', {
      channelId,
      commentId: 'c1',
    });
    expect(removeResult.success).toBe(true);

    const getResult = await claude.send<{ comments: any[] }>('plan:comments', { channelId });
    expect(getResult.comments).toHaveLength(1);
    expect(getResult.comments[0].id).toBe('c2');
  });

  it('plan:remove_comment returns error for unknown commentId', async () => {
    const { claude, channelId } = await setup();

    const result = await claude.send<{ success: boolean; error?: string }>('plan:remove_comment', {
      channelId,
      commentId: 'unknown',
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('Comment not found');
  });

  it('plan:close_preview clears all comments for session', async () => {
    const { claude, channelId } = await setup();

    await claude.send<any>('plan:comment', {
      channelId,
      comment: { id: 'c1', selectedText: 't1', sectionHeading: 'h1', comment: 'n1' },
    });

    const closeResult = await claude.send<{ success: boolean }>('plan:close_preview', {
      channelId,
    });
    expect(closeResult.success).toBe(true);

    const getResult = await claude.send<{ comments: any[] }>('plan:comments', { channelId });
    expect(getResult.comments).toHaveLength(0);
  });

  it('chat:control_response serializes plan comments as userFeedback for ExitPlanMode', async () => {
    const { claude, channelId } = await setup();

    await claude.send('chat:send', { channelId, message: 'plan something' });

    await claude.emit(s.controlRequestExitPlanMode('req-plan-1'));

    // Add plan comments
    await claude.send<any>('plan:comment', {
      channelId,
      comment: {
        id: 'c1',
        selectedText: 'step 1',
        sectionHeading: 'Plan',
        comment: 'needs more detail',
      },
    });
    await claude.send<any>('plan:comment', {
      channelId,
      comment: {
        id: 'c2',
        selectedText: 'step 3',
        sectionHeading: 'Plan',
        comment: 'remove this',
      },
    });

    // Approve the plan
    await claude.send('chat:respond', {
      channelId,
      requestId: 'req-plan-1',
      response: { behavior: 'allow', updatedInput: {} },
    });

    // Comments should be cleared (serialized into userFeedback)
    const getResult = await claude.send<{ comments: any[] }>('plan:comments', { channelId });
    expect(getResult.comments).toHaveLength(0);
  });
});
