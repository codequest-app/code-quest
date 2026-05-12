import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Highlight } from '../Highlight.tsx';

describe('Highlight', () => {
  it('renders code content with lang', () => {
    const { container } = render(<Highlight lang="bash">echo hello</Highlight>);
    expect(container.textContent).toContain('echo hello');
  });

  it('renders plain content when no lang or filePath', () => {
    const { container } = render(<Highlight>plain text</Highlight>);
    expect(container.textContent).toContain('plain text');
  });

  it('renders content when filePath is provided', () => {
    const { container } = render(
      <Highlight filePath="/src/components/App.tsx">const x = 1;</Highlight>,
    );
    expect(container.textContent).toContain('const x = 1;');
  });

  it('renders content when filePath has unknown extension', () => {
    const { container } = render(<Highlight filePath="/some/file.unknownext">content</Highlight>);
    expect(container.textContent).toContain('content');
  });
});
