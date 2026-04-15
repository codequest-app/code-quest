import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithChannel } from '../../test/render-with-channel';
import { useChannelCompose } from '../channel';

/** Renders a test harness that exposes compose context via UI */
function ComposeTestUI() {
  const compose = useChannelCompose();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    compose.registerFocus((pos?: number) => {
      const el = textareaRef.current;
      if (!el) return;
      if (pos !== undefined) {
        setTimeout(() => {
          el.focus();
          el.setSelectionRange(pos, pos);
        }, 0);
      } else {
        el.focus();
      }
    });
  }, [compose.registerFocus]);

  return (
    <div>
      <textarea
        ref={textareaRef}
        value={compose.value}
        onChange={(e) => {
          const pos = e.target.selectionStart;
          compose.updateValue(e.target.value, pos);
        }}
        placeholder="compose"
      />
      <span data-testid="hasText">{String(compose.hasText)}</span>
      <span data-testid="slashFilter">{compose.slashFilter ?? 'null'}</span>
      <span data-testid="mentionOpen">{String(compose.mentionOpen)}</span>
      <span data-testid="hasTextBeforeSlash">{String(compose.hasTextBeforeSlash)}</span>
      <button type="button" onClick={compose.submit}>
        Submit
      </button>
      <button type="button" onClick={compose.focusTextarea}>
        Focus
      </button>
      <button type="button" onClick={compose.mentionFile}>
        Mention
      </button>
      <button type="button" onClick={compose.closeMention}>
        CloseMention
      </button>
      <button type="button" onClick={() => compose.addAttachments([new File([''], 'test.txt')])}>
        Attach
      </button>
      <button type="button" onClick={() => compose.insertSlashCommand('/compact ')}>
        Insert
      </button>
      <button type="button" onClick={() => compose.executeSlashCommand('/compact')}>
        Execute
      </button>
      <button type="button" onClick={compose.closeSlash}>
        CloseSlash
      </button>
      {compose.attachedFiles.map((f, i) => (
        <span key={f.name}>
          {f.name}
          <button type="button" onClick={() => compose.removeAttachment(i)}>
            Remove
          </button>
        </span>
      ))}
    </div>
  );
}

async function setup() {
  return renderWithChannel(<ComposeTestUI />);
}

describe('ChannelComposeProvider', () => {
  it('provides initial empty state', async () => {
    await setup();
    expect(screen.getByPlaceholderText('compose')).toHaveValue('');
    expect(screen.getByTestId('hasText')).toHaveTextContent('false');
    expect(screen.getByTestId('slashFilter')).toHaveTextContent('null');
  });

  it('hasText reflects textarea value', async () => {
    await setup();
    await userEvent.type(screen.getByPlaceholderText('compose'), 'hello');
    expect(screen.getByTestId('hasText')).toHaveTextContent('true');
  });

  it('submit clears value after sending', async () => {
    await setup();
    await userEvent.type(screen.getByPlaceholderText('compose'), 'hello');
    await userEvent.click(screen.getByText('Submit'));

    expect(screen.getByPlaceholderText('compose')).toHaveValue('');
  });

  it('submit does nothing when value is empty', async () => {
    await setup();
    const textarea = screen.getByPlaceholderText('compose');
    expect(textarea).toHaveValue('');
    await userEvent.click(screen.getByText('Submit'));
    // Still empty, no error thrown
    expect(textarea).toHaveValue('');
  });

  it('focusTextarea focuses the textarea', async () => {
    await setup();
    await userEvent.click(screen.getByText('Focus'));
    expect(screen.getByPlaceholderText('compose')).toHaveFocus();
  });

  it('mentionFile sets mentionOpen to true in context', async () => {
    await setup();
    await userEvent.type(screen.getByPlaceholderText('compose'), 'hello ');
    expect(screen.getByTestId('mentionOpen')).toHaveTextContent('false');
    await userEvent.click(screen.getByText('Mention'));
    expect(screen.getByTestId('mentionOpen')).toHaveTextContent('true');
  });

  it('closeMention in context sets mentionOpen to false', async () => {
    await setup();
    await userEvent.type(screen.getByPlaceholderText('compose'), 'hello ');
    await userEvent.click(screen.getByText('Mention'));
    expect(screen.getByTestId('mentionOpen')).toHaveTextContent('true');
    await userEvent.click(screen.getByText('CloseMention'));
    expect(screen.getByTestId('mentionOpen')).toHaveTextContent('false');
  });

  it('mentionFile inserts @ at cursor position', async () => {
    await setup();
    await userEvent.type(screen.getByPlaceholderText('compose'), 'hello ');
    await userEvent.click(screen.getByText('Mention'));
    expect(screen.getByPlaceholderText('compose')).toHaveValue('hello @');
  });

  it('mentionFile does not insert duplicate @ when cursor is already after @', async () => {
    await setup();
    await userEvent.type(screen.getByPlaceholderText('compose'), '@');
    await userEvent.click(screen.getByText('Mention'));
    expect(screen.getByPlaceholderText('compose')).toHaveValue('@');
  });

  it('mentionFile called twice on / does not produce @@', async () => {
    await setup();
    await userEvent.type(screen.getByPlaceholderText('compose'), '/');
    // Simulate being called twice (e.g. StrictMode double-invoke side effect)
    await userEvent.click(screen.getByText('Mention'));
    await userEvent.click(screen.getByText('Mention'));
    expect(screen.getByPlaceholderText('compose')).toHaveValue('@');
  });
});
