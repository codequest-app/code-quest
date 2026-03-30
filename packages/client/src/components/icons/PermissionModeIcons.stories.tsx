import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AskBeforeEditsIcon,
  AskBeforeEditsSmallIcon,
  BypassIcon,
  CheckIcon,
  EditAutoIcon,
  EditAutoSmallIcon,
  EffortIcon,
  PlanModeIcon,
  PlanModeSmallIcon,
} from './PermissionModeIcons';

const AllIcons = () => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <AskBeforeEditsIcon />
      <AskBeforeEditsSmallIcon />
      <span className="text-xs text-text-muted">Ask Before Edits</span>
    </div>
    <div className="flex items-center gap-3">
      <EditAutoIcon />
      <EditAutoSmallIcon />
      <span className="text-xs text-text-muted">Edit Automatically</span>
    </div>
    <div className="flex items-center gap-3">
      <PlanModeIcon />
      <PlanModeSmallIcon />
      <span className="text-xs text-text-muted">Plan Mode</span>
    </div>
    <div className="flex items-center gap-3">
      <BypassIcon />
      <span className="text-xs text-text-muted">Bypass Permissions</span>
    </div>
    <div className="flex items-center gap-3">
      <EffortIcon />
      <span className="text-xs text-text-muted">Effort</span>
    </div>
    <div className="flex items-center gap-3">
      <CheckIcon />
      <span className="text-xs text-text-muted">Check</span>
    </div>
  </div>
);

const meta = {
  component: AllIcons,
  title: 'icons/PermissionModeIcons',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="bg-surface text-text p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AllIcons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = {};
