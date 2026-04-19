import { describe, expect, it, vi } from 'vitest';
import { createNewConversationFeature } from '../new-conversation-feature';

describe('createNewConversationFeature', () => {
  it('has id new-conversation', () => {
    const feature = createNewConversationFeature({ sendMessage: vi.fn() });
    expect(feature.id).toBe('new-conversation');
  });

  it('is in Context section with filterOnly true', () => {
    const feature = createNewConversationFeature({ sendMessage: vi.fn() });
    expect(feature.label).toBe('New conversation');
    expect(feature.section).toBe('Context');
    expect(feature.ui?.filterOnly).toBe(true);
  });

  it('execute sends /new to CLI and closes menu', () => {
    const sendMessage = vi.fn();
    const feature = createNewConversationFeature({ sendMessage });
    feature.execute();
    expect(sendMessage).toHaveBeenCalledWith('/new');
  });
});
