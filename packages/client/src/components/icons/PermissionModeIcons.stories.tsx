import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckMark } from '../ui/Icons';
import {
  AskBeforeEditsIcon,
  BypassIcon,
  EditAutoIcon,
  EffortIcon,
  PlanModeIcon,
} from './PermissionModeIcons';

const Row = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-3">
    {children}
    <span className="text-xs text-text-muted">{label}</span>
  </div>
);

const Box = ({ children }: { children: React.ReactNode }) => (
  <span className="w-6 h-6 shrink-0">{children}</span>
);

const AllIcons = () => (
  <div className="flex flex-col gap-4">
    <Row label="Ask Before Edits">
      <Box>
        <AskBeforeEditsIcon />
      </Box>
    </Row>
    <Row label="Edit Automatically">
      <Box>
        <EditAutoIcon />
      </Box>
    </Row>
    <Row label="Plan Mode">
      <Box>
        <PlanModeIcon />
      </Box>
    </Row>
    <Row label="Bypass Permissions">
      <Box>
        <BypassIcon />
      </Box>
    </Row>
    <Row label="Effort">
      <Box>
        <EffortIcon />
      </Box>
    </Row>
    <Row label="Check">
      <CheckMark className="w-4 h-4" />
    </Row>
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
