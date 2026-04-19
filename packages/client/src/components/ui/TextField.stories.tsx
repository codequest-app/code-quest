import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { withThemePreset } from '../../test/story-decorator';
import { TextField } from './TextField';

// biome-ignore lint/suspicious/noExplicitAny: discriminated-union Meta inference resolves args to `never`; explicit any keeps stories simple
const meta: Meta<any> = {
  component: TextField,
  tags: ['autodocs'],
  args: { onChange: fn() },
  decorators: [
    (Story) => (
      <div className="bg-bg text-text p-6 w-90">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const InputEmpty: Story = {
  args: { as: 'input' as const, value: '', placeholder: 'Enter value…' },
};

export const InputFilled: Story = {
  args: { as: 'input' as const, value: 'example', placeholder: 'Enter value…' },
};

export const Textarea: Story = {
  args: { as: 'textarea' as const, value: '', placeholder: 'Multi-line…', rows: 4 },
};

export const Disabled: Story = {
  args: { as: 'input' as const, value: 'locked', disabled: true, placeholder: 'Disabled' },
};

export const Light: Story = {
  args: { as: 'input' as const, value: 'light-mode', placeholder: 'Enter…' },
  decorators: [withThemePreset({ theme: 'light' })],
};
