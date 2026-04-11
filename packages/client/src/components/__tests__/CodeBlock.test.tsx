import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CodeBlock } from '../CodeBlock';

describe('CodeBlock', () => {
  it('renders code content with language highlight', () => {
    const { container } = render(<CodeBlock code="console.log('hi')" language="js" />);
    expect(container.textContent).toContain("console.log('hi')");
  });

  it('calls navigator.clipboard.writeText on copy click', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    render(<CodeBlock code="hello world" language="js" />);
    await user.click(screen.getByRole('button', { name: /copy/i }));
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith('hello world');
    });
    spy.mockRestore();
  });

  it('shows "Copied!" temporarily after clicking copy', async () => {
    const spy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CodeBlock code="test" language="js" />);
    await user.click(screen.getByRole('button', { name: /copy/i }));
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
    spy.mockRestore();
  });

  it('does not show copy button for inline code (no language)', () => {
    render(<CodeBlock code="inline" />);
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });
});
