import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeSummoner } from '@/test/fake-summoner';
import { FsProvidersWrapper } from '@/test/wrap-fs-providers';
import { FilePreviewModal } from '../FilePreviewModal';

function setup() {
  const summoner = createFakeSummoner();
  summoner.filesystem().setRoots(['/repo']);
  summoner.filesystem().addDirectory('/repo', []);
  function Wrapper({ children }: { children: ReactNode }) {
    return <FsProvidersWrapper socket={summoner.socket}>{children}</FsProvidersWrapper>;
  }
  return { summoner, Wrapper };
}

function installClipboardSpy() {
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return writeText;
}

describe('FilePreviewModal', () => {
  beforeEach(() => {
    installClipboardSpy();
  });

  it('renders path in header and Mention / Copy path actions', async () => {
    const { summoner, Wrapper } = setup();
    summoner.filesystem().addFile('/repo/README.md', '# hi');
    render(<FilePreviewModal path="/repo/README.md" onClose={vi.fn()} onMention={vi.fn()} />, {
      wrapper: Wrapper,
    });

    expect(await screen.findByText('/repo/README.md')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mention/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy path/i })).toBeInTheDocument();
  });

  it('Mention button invokes onMention with path', async () => {
    const user = userEvent.setup();
    const { summoner, Wrapper } = setup();
    summoner.filesystem().addFile('/repo/a.ts', 'export {}');
    const onMention = vi.fn();
    render(<FilePreviewModal path="/repo/a.ts" onClose={vi.fn()} onMention={onMention} />, {
      wrapper: Wrapper,
    });
    await screen.findByText('/repo/a.ts');
    await user.click(screen.getByRole('button', { name: /mention/i }));
    expect(onMention).toHaveBeenCalledWith('/repo/a.ts');
  });

  it('Copy path writes to clipboard', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    const writeText = installClipboardSpy();
    const { summoner, Wrapper } = setup();
    summoner.filesystem().addFile('/repo/a.ts', 'export {}');
    render(<FilePreviewModal path="/repo/a.ts" onClose={vi.fn()} onMention={vi.fn()} />, {
      wrapper: Wrapper,
    });
    await screen.findByText('/repo/a.ts');
    await user.click(screen.getByRole('button', { name: /copy path/i }));
    expect(writeText).toHaveBeenCalledWith('/repo/a.ts');
  });

  it('renders file contents fetched from server', async () => {
    const { summoner, Wrapper } = setup();
    summoner.filesystem().addFile('/repo/hello.txt', 'hello world');
    render(<FilePreviewModal path="/repo/hello.txt" onClose={vi.fn()} onMention={vi.fn()} />, {
      wrapper: Wrapper,
    });
    expect(await screen.findByText(/hello world/)).toBeInTheDocument();
  });

  it('shows fallback when server returns error', async () => {
    const { Wrapper } = setup();
    render(<FilePreviewModal path="/repo/missing.txt" onClose={vi.fn()} onMention={vi.fn()} />, {
      wrapper: Wrapper,
    });
    expect(await screen.findByText(/file not found/i)).toBeInTheDocument();
  });
});
