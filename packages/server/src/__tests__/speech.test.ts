/* biome-ignore-all lint/suspicious/noExplicitAny: test file uses type assertions */
import { segments as s } from '@code-quest/summoner/test';
import { createFakeSummoner } from '../test/index.ts';

async function setup(sessionId = 'cli-sess') {
  const claude = createFakeSummoner().claude();
  const channelId = await claude.initialize(s.init(sessionId));
  return { claude, channelId };
}

describe('ChatHandler > speech', () => {
  it('speech:start sends start_speech_to_text to CLI', async () => {
    const { claude, channelId } = await setup();

    await claude.send('speech:start', { channelId });

    const msgs = claude.received('start_speech_to_text');
    expect(msgs.length).toBe(1);
    expect(msgs[0]!.channelId).toBe(channelId);
  });

  it('speech:stop sends stop_speech_to_text to CLI', async () => {
    const { claude, channelId } = await setup();

    await claude.send('speech:stop', { channelId });

    const msgs = claude.received('stop_speech_to_text');
    expect(msgs.length).toBe(1);
    expect(msgs[0]!.channelId).toBe(channelId);
  });

  it('speech_to_text_message from CLI is forwarded as speech:message', async () => {
    const { claude, channelId } = await setup();

    await claude.emitSegment(s.speechToTextMessage(channelId, 'hello world', false));

    const speechEvents = claude.receivedEvents('speech:message');
    expect(speechEvents.length).toBe(1);
    expect(speechEvents[0]!.text).toBe('hello world');
    expect(speechEvents[0]!.done).toBe(false);
  });
});
