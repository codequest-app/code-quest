import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatPanel } from '../ChatPanel.tsx';

describe('ChatPanel layout (compound component)', () => {
  it('Header slot renders its children', () => {
    render(
      <ChatPanel>
        <ChatPanel.Header>
          <div>My Header</div>
        </ChatPanel.Header>
      </ChatPanel>,
    );
    expect(screen.getByText('My Header')).toBeInTheDocument();
  });

  it('Body slot renders its children', () => {
    render(
      <ChatPanel>
        <ChatPanel.Body>
          <div>Message List</div>
        </ChatPanel.Body>
      </ChatPanel>,
    );
    expect(screen.getByText('Message List')).toBeInTheDocument();
  });

  it('Footer slot renders its children', () => {
    render(
      <ChatPanel>
        <ChatPanel.Footer>
          <div>Compose</div>
        </ChatPanel.Footer>
      </ChatPanel>,
    );
    expect(screen.getByText('Compose')).toBeInTheDocument();
  });

  it('Side slot renders when provided', () => {
    render(
      <ChatPanel>
        <ChatPanel.Side>
          <div>Side Panel</div>
        </ChatPanel.Side>
      </ChatPanel>,
    );
    expect(screen.getByText('Side Panel')).toBeInTheDocument();
  });

  it('Side slot is absent when not provided', () => {
    const { container } = render(
      <ChatPanel>
        <ChatPanel.Header>
          <div>header</div>
        </ChatPanel.Header>
      </ChatPanel>,
    );
    expect(container.querySelector('[data-side-panel]')).not.toBeInTheDocument();
  });

  it('renders without error when no children provided', () => {
    expect(() => render(<ChatPanel />)).not.toThrow();
  });

  it('Body slot children are direct flex children of the chat column (no extra wrapper div)', () => {
    render(
      <ChatPanel>
        <ChatPanel.Body>
          <div data-testid="body-child">body content</div>
        </ChatPanel.Body>
      </ChatPanel>,
    );
    const bodyChild = screen.getByTestId('body-child');
    // Parent should be the chat column (relative flex-col), not an intermediate wrapper
    const chatColumn = bodyChild.parentElement;
    expect(chatColumn?.className).toMatch(/relative/);
    expect(chatColumn?.className).toMatch(/flex-col/);
  });

  it('Footer slot content appears inside the absolute footer container', () => {
    render(
      <ChatPanel>
        <ChatPanel.Footer>
          <div>compose input</div>
        </ChatPanel.Footer>
      </ChatPanel>,
    );
    const footerContent = screen.getByText('compose input');
    // Walk up to find the absolute-positioned ancestor
    let el: HTMLElement | null = footerContent;
    let foundAbsolute = false;
    while (el) {
      if (el.className.includes('absolute') && el.className.includes('bottom-0')) {
        foundAbsolute = true;
        break;
      }
      el = el.parentElement;
    }
    expect(foundAbsolute).toBe(true);
  });
});
