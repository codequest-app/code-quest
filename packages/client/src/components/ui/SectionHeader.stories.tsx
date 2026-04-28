import type { Meta, StoryObj } from '@storybook/react-vite';
import { withThemePreset } from '../../test/story-decorator';
import { SectionHeader } from './SectionHeader';

const meta: Meta<typeof SectionHeader> = {
  component: SectionHeader,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text p-6 w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: 'Projects' },
};

export const Filters: Story = {
  args: { children: 'Filters' },
};

export const Light: Story = {
  args: { children: 'Projects' },
  decorators: [withThemePreset({ theme: 'light' })],
};
