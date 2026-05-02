import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { withStoryChannel } from '@/test/story-decorator';
import { ComposeToolbar } from './ComposeToolbar.tsx';

// ComposeToolbar opens CommandMenu upward — position at bottom of screen so it has room to expand.
const CLASS = 'flex flex-col h-screen bg-bg text-text justify-end items-center p-4';

function ComposeToolbarStory(): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref} className="w-2xl rounded-xl bg-surface border border-border">
      <ComposeToolbar containerRef={ref} onAttachFile={() => {}} />
    </div>
  );
}

const meta: Meta<typeof ComposeToolbarStory> = {
  component: ComposeToolbarStory,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ComposeToolbarStory>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  decorators: [withStoryChannel({ config: { permissionMode: 'normal' }, className: CLASS })],
};
export const Processing: Story = {
  decorators: [withStoryChannel({ messages: { status: 'processing' }, className: CLASS })],
};
export const AcceptEdits: Story = {
  decorators: [withStoryChannel({ config: { permissionMode: 'acceptEdits' }, className: CLASS })],
};
export const WithUsage: Story = {
  decorators: [
    withStoryChannel({ messages: { stats: { inputTokens: 120000 } }, className: CLASS }),
  ],
};
