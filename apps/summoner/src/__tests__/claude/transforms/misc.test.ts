import { describe, expect, it } from 'vitest';
import { segments as s } from '../../../test/segments-node.ts';
import { toClientMessage } from '../helpers.ts';

describe('transform — misc', () => {
  it('converts notification to toast', () => {
    expect(toClientMessage(s.notification('hello'))).toMatchObject({
      name: 'notification:toast',
      payload: { message: 'hello' },
    });
  });

  it('converts error', () => {
    expect(toClientMessage(s.error('boom'))).toMatchObject({
      name: 'error:message',
      payload: { message: 'boom' },
    });
  });

  it('converts speech_to_text_message', () => {
    expect(toClientMessage(s.speechToTextMessage('ch-1', 'hello world', true))).toMatchObject({
      name: 'speech:message',
      payload: { text: 'hello world', done: true },
    });
  });
});
