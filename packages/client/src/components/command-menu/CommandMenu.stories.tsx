import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { fn } from 'storybook/test';
import { withStoryChannel } from '../../test/story-decorator';
import { CommandMenu } from './CommandMenu';

const meta: Meta<typeof CommandMenu> = {
  component: CommandMenu,
  tags: ['autodocs'],
  args: {
    containerRef: { current: null },
    onMcpStatus: fn(),
    onToggleMcp: fn(),
    onManagePlugins: fn(),
    onAttachFile: fn(),
  },
  decorators: [
    withStoryChannel({
      className: 'relative h-100 bg-bg text-text flex items-end p-4',
    }),
    (Story) => {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <div ref={ref}>
          <Story args={{ containerRef: ref }} />
        </div>
      );
    },
  ],
} satisfies Meta<typeof CommandMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
