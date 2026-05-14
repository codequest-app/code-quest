import type { Meta, StoryObj } from '@storybook/react-vite';
import { RotatableChevron } from '@/components/ui/Icons';
import { cn } from '@/utils/cn';
import { CenterDivider } from '../ui/CenterDivider';

function StatusLine({
  icon,
  children,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-xs', className)}>
      <span className="inline-flex items-center">{icon}</span>
      {children}
    </div>
  );
}

const meta: Meta = {
  title: 'tool-use/primitives',
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType): React.JSX.Element => (
      <div className="bg-bg text-text p-6 max-w-lg">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const ChevronClosed: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <RotatableChevron />
      <span className="text-sm">Closed</span>
    </div>
  ),
};

export const ChevronOpen: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <RotatableChevron open />
      <span className="text-sm">Open</span>
    </div>
  ),
};

export const StatusLineVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <StatusLine icon="✓">All checks passed</StatusLine>
      <StatusLine icon="⏳" className="text-warning">
        Running...
      </StatusLine>
      <StatusLine icon="✗" className="text-danger">
        Build failed
      </StatusLine>
    </div>
  ),
};

export const Divider: Story = {
  render: () => <CenterDivider>Context compacted</CenterDivider>,
};
