import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollapsibleBlock, RotatableChevron, StatusLine } from './shared';

const Showcase = () => (
  <div className="flex flex-col gap-6 bg-bg text-text p-6">
    <section className="flex flex-col gap-2">
      <h3 className="text-xs text-text-muted">RotatableChevron</h3>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <RotatableChevron />
          <span className="text-sm">closed</span>
        </div>
        <div className="flex items-center gap-1">
          <RotatableChevron open />
          <span className="text-sm">open</span>
        </div>
      </div>
    </section>

    <section className="flex flex-col gap-2">
      <h3 className="text-xs text-text-muted">StatusLine</h3>
      <StatusLine icon="✓">All checks passed</StatusLine>
      <StatusLine icon="⏳" className="text-warning">
        Running...
      </StatusLine>
      <StatusLine icon="✗" className="text-danger">
        Build failed
      </StatusLine>
    </section>

    <section className="flex flex-col gap-2">
      <h3 className="text-xs text-text-muted">CollapsibleBlock</h3>
      <CollapsibleBlock icon="📄" label="example.ts" labelDetail="src/utils" labelRange="1-42">
        <pre className="bg-code-block p-3 rounded text-xs font-mono">
          {`function hello() {\n  return 'world';\n}`}
        </pre>
      </CollapsibleBlock>
    </section>
  </div>
);

const meta = {
  component: Showcase,
  title: 'message-blocks/shared',
  tags: ['autodocs'],
} satisfies Meta<typeof Showcase>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllHelpers: Story = {};
