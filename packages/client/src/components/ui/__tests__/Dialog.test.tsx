import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog, DialogClose, DialogContent } from '../Dialog';

describe('Dialog', () => {
  it('renders content when open', () => {
    render(
      <Dialog open>
        <DialogContent title="Test Dialog">
          <p>Hello</p>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
  });

  it('does not render content when closed', () => {
    render(
      <Dialog open={false}>
        <DialogContent title="Test Dialog">
          <p>Hello</p>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('closes on Escape by default', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent title="Test Dialog">
          <p>Content</p>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.setup().keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close on Escape when mandatory', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent title="Test Dialog" mandatory>
          <p>Content</p>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.setup().keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('hides title visually when hideTitle is true', () => {
    render(
      <Dialog open>
        <DialogContent title="Hidden Title" hideTitle>
          <p>Content</p>
        </DialogContent>
      </Dialog>,
    );
    const title = screen.getByText('Hidden Title');
    expect(title).toHaveClass('sr-only');
  });

  it('applies size="lg" sizing class when provided', () => {
    render(
      <Dialog open>
        <DialogContent title="Large" size="lg">
          <p>Big dialog</p>
        </DialogContent>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toMatch(/w-160/);
  });

  it('applies size="fullscreen" when provided', () => {
    render(
      <Dialog open>
        <DialogContent title="Full" size="fullscreen">
          <p>Full viewer</p>
        </DialogContent>
      </Dialog>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toMatch(/w-screen/);
  });

  it('renders DialogClose button', async () => {
    const onOpenChange = vi.fn();
    render(
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent title="Test">
          <DialogClose asChild>
            <button type="button">Close</button>
          </DialogClose>
        </DialogContent>
      </Dialog>,
    );
    await userEvent.setup().click(screen.getByText('Close'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
