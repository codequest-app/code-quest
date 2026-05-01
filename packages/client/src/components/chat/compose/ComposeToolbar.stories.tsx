import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { withStoryChannel } from '../../../test/story-decorator';
import { ComposeToolbar } from './ComposeToolbar';

// Wraps the toolbar in a bordered box that mimics the real compose input container.
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
} satisfies Meta<typeof ComposeToolbarStory>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  decorators: [withStoryChannel({ config: { permissionMode: 'normal' } })],
};
export const Processing: Story = {
  decorators: [withStoryChannel({ messages: { status: 'processing' } })],
};
export const AcceptEdits: Story = {
  decorators: [withStoryChannel({ config: { permissionMode: 'acceptEdits' } })],
};
export const WithUsage: Story = {
  decorators: [withStoryChannel({ messages: { stats: { inputTokens: 120000 } } })],
};
